import { useCallback, useEffect, useState } from "react";
import { listDocuments, deleteDocument, type Document } from "../lib/api";
import { UploadForm } from "../components/UploadForm";
import { DocumentList } from "../components/DocumentList";

function DocumentSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-stretch rounded-lg border border-border bg-surface h-[62px] overflow-hidden animate-pulse"
        >
          <div className="w-1 bg-border flex-shrink-0" />
          <div className="flex flex-1 items-center gap-3 px-4">
            <div className="w-8 h-8 rounded-md bg-border flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="h-3 bg-border rounded w-1/2" />
              <div className="h-2 bg-border rounded w-1/4" />
            </div>
          </div>
          <div className="px-4 flex flex-col items-end justify-center gap-1.5">
            <div className="h-5 bg-border rounded-full w-12" />
            <div className="h-2 bg-border rounded w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteDocument(id);
      await load();
    },
    [load]
  );

  const totalChunks = documents
    .filter((d) => d.status === "ready")
    .reduce((sum, d) => sum + d.chunkCount, 0);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <header className="mb-8">
        <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-primary mb-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          Knowledge Base
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Documents</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Upload and index documents to use in chat
            </p>
          </div>
          {documents.length > 0 && (
            <div
              data-testid="stats-chip"
              className="flex items-stretch shrink-0 rounded-lg border border-border overflow-hidden bg-surface"
            >
              <div className="flex flex-col items-end px-4 py-2">
                <span
                  data-testid="stat-docs-value"
                  className="text-lg font-extrabold text-foreground leading-none"
                >
                  {documents.length}
                </span>
                <span className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground mt-0.5">
                  docs
                </span>
              </div>
              <div className="w-px bg-border self-stretch" />
              <div className="flex flex-col items-end px-4 py-2">
                <span
                  data-testid="stat-chunks-value"
                  className="text-lg font-extrabold text-foreground leading-none"
                >
                  {totalChunks}
                </span>
                <span className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground mt-0.5">
                  chunks
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      <UploadForm onSuccess={load} />

      <section className="mt-10">
        {loading ? (
          <DocumentSkeleton />
        ) : error ? (
          <p className="text-xs text-muted-foreground">
            Could not reach the API —{" "}
            <button
              onClick={load}
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              retry
            </button>
          </p>
        ) : (
          <DocumentList documents={documents} onDelete={handleDelete} />
        )}
      </section>
    </div>
  );
}
