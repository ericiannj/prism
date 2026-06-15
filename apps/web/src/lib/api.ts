import { authClient } from "./auth-client";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const { data, error } = await authClient.token();
  const token = !error && data ? data.token : undefined;
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

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
  const res = await apiFetch("/documents");
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json() as Promise<Document[]>;
}

export async function ingest(file: File): Promise<Document> {
  const body = new FormData();
  body.append("file", file);
  const res = await apiFetch("/documents/ingest", { method: "POST", body });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Ingestion failed");
  }
  const data = (await res.json()) as { document: Document };
  return data.document;
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await apiFetch(`/documents/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete document");
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
}

export interface StoredToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
  result: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  source?: "parametric" | "embeddings" | "web" | "mixed";
  toolCalls?: StoredToolCall[] | null;
  createdAt: string;
}

export async function listSessions(): Promise<ChatSession[]> {
  const res = await apiFetch("/chat/sessions");
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json() as Promise<ChatSession[]>;
}

export async function renameSession(id: string, title: string): Promise<ChatSession> {
  const res = await apiFetch(`/chat/sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to rename session");
  return res.json() as Promise<ChatSession>;
}

export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  const res = await apiFetch(`/chat/${sessionId}/messages`);
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json() as Promise<ChatMessage[]>;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (result: {
    sessionId: string;
    source: string;
    toolCalls: StoredToolCall[] | undefined;
  }) => void;
  onError: (error: string) => void;
}

export async function sendMessage(
  message: string,
  sessionId: string | undefined,
  callbacks: StreamCallbacks
): Promise<void> {
  const res = await apiFetch("/chat", {
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
        toolCalls?: StoredToolCall[];
        error?: string;
      };

      if (payload.type === "token" && payload.content !== undefined) {
        callbacks.onToken(payload.content);
      }
      if (payload.type === "done" && payload.sessionId && payload.source) {
        callbacks.onDone({
          sessionId: payload.sessionId,
          source: payload.source,
          toolCalls: payload.toolCalls,
        });
      }
      if (payload.type === "error") {
        callbacks.onError(payload.error ?? "Unknown error");
      }
    }
  }
}
