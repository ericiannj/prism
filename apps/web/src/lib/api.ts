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
