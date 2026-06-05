import { useEffect, useState } from "react";
import { listDocuments, type Document } from "../lib/api";
import { UploadForm } from "../components/UploadForm";
import { DocumentList } from "../components/DocumentList";

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
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
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload documents to build your personal knowledge base
        </p>
      </header>

      <UploadForm onSuccess={load} />

      <section className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Your documents
          </p>
          {documents.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {documents.length} {documents.length === 1 ? "document" : "documents"}
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
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
          <DocumentList documents={documents} />
        )}
      </section>
    </div>
  );
}
