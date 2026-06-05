const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Document {
  id: string;
  name: string;
  type: "pdf" | "txt" | "md";
  sizeBytes: number;
  status: "processing" | "ready" | "error";
  chunkCount: number;
  createdAt: string;
}

export async function listDocuments(): Promise<Document[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json() as Promise<Document[]>;
}

export async function ingest(file: File): Promise<Document> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${API_BASE}/documents/ingest`, { method: "POST", body });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Ingestion failed");
  }
  const data = (await res.json()) as { document: Document };
  return data.document;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  source?: "parametric" | "embeddings" | "web" | "mixed";
  toolCalls?: unknown;
  createdAt: string;
}

export async function listSessions(): Promise<ChatSession[]> {
  const res = await fetch(`${API_BASE}/chat/sessions`);
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json() as Promise<ChatSession[]>;
}

export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE}/chat/${sessionId}/messages`);
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json() as Promise<ChatMessage[]>;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (result: { sessionId: string; source: string }) => void;
  onError: (error: string) => void;
}

export async function sendMessage(
  message: string,
  sessionId: string | undefined,
  callbacks: StreamCallbacks
): Promise<void> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message }),
  });

  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = JSON.parse(line.slice(6)) as {
        type: string;
        content?: string;
        sessionId?: string;
        source?: string;
        error?: string;
      };

      if (payload.type === "token" && payload.content !== undefined) {
        callbacks.onToken(payload.content);
      }
      if (payload.type === "done" && payload.sessionId && payload.source) {
        callbacks.onDone({ sessionId: payload.sessionId, source: payload.source });
      }
      if (payload.type === "error") {
        callbacks.onError(payload.error ?? "Unknown error");
      }
    }
  }
}
