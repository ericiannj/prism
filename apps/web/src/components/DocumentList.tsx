import { Badge } from "@prism/ui";
import type { BadgeProps } from "@prism/ui";
import type { Document } from "../lib/api";

const STATUS_VARIANT: Record<Document["status"], BadgeProps["variant"]> = {
  ready: "status-ready",
  processing: "status-processing",
  error: "status-error",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  documents: Document[];
}

export function DocumentList({ documents }: Props) {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents yet. Upload one above.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{doc.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {doc.status === "processing" ? (
                "Extracting text and generating embeddings…"
              ) : (
                <>
                  {doc.chunkCount} {doc.chunkCount === 1 ? "chunk" : "chunks"} ·{" "}
                  {formatBytes(doc.sizeBytes)} · ingested {timeAgo(doc.createdAt)}
                </>
              )}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[doc.status]}>{doc.status}</Badge>
        </div>
      ))}
    </div>
  );
}
