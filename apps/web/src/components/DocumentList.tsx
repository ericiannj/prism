import { FileText } from "lucide-react";
import { Badge } from "@prism/ui";
import type { BadgeProps } from "@prism/ui";
import type { Document } from "../lib/api";

const STATUS_VARIANT: Record<Document["status"], BadgeProps["variant"]> = {
  ready: "status-ready",
  processing: "status-processing",
  error: "status-error",
};

const STRIPE_STYLE: Record<Document["type"], React.CSSProperties> = {
  pdf: { background: "linear-gradient(to bottom, #7c3aed, #0ea5e9)" },
  md: { background: "#8b5cf6" },
  txt: { background: "#fb923c" },
};

const ICON_STYLE: Record<Document["type"], React.CSSProperties> = {
  pdf: { background: "rgba(14,165,233,0.12)", color: "#0ea5e9" },
  md: { background: "rgba(139,92,246,0.12)", color: "#8b5cf6" },
  txt: { background: "rgba(251,146,60,0.12)", color: "#fb923c" },
};

const ICON_LABEL: Record<Document["type"], string> = {
  pdf: "PDF",
  md: "MD",
  txt: "TXT",
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
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <div className="w-9 h-9 rounded-full border-[1.5px] border-dashed border-primary/20 flex items-center justify-center">
          <FileText className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No documents yet.</p>
        <p className="text-xs text-muted-foreground/60">
          Upload one above to start building your knowledge base.
        </p>
      </div>
    );
  }

  const readyDocs = documents.filter((d) => d.status === "ready");
  const totalChunks = readyDocs.reduce((sum, d) => sum + d.chunkCount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Indexed documents
        </p>
        <p data-testid="section-count" className="text-xs text-muted-foreground">
          {documents.length} {documents.length === 1 ? "doc" : "docs"}
          {totalChunks > 0 ? ` · ${totalChunks} chunks` : ""}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-stretch rounded-lg overflow-hidden border border-border bg-surface"
          >
            <div className="w-1 flex-shrink-0" style={STRIPE_STYLE[doc.type]} />

            <div className="flex flex-1 min-w-0 items-center gap-3 px-4 py-3">
              <div
                className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-[9px] font-extrabold"
                style={ICON_STYLE[doc.type]}
              >
                {ICON_LABEL[doc.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{doc.name}</p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {doc.status === "processing" ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-[rgba(251,146,60,0.06)] text-[#fb923c] border border-[rgba(251,146,60,0.2)]">
                      extracting & embedding…
                    </span>
                  ) : doc.status === "ready" ? (
                    <>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-white/[0.04] text-muted-foreground border border-white/[0.07]">
                        {doc.chunkCount} {doc.chunkCount === 1 ? "chunk" : "chunks"}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-white/[0.04] text-muted-foreground border border-white/[0.07]">
                        {formatBytes(doc.sizeBytes)}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end justify-between px-4 py-3 flex-shrink-0 gap-1.5">
              <Badge variant={STATUS_VARIANT[doc.status]}>{doc.status}</Badge>
              <span className="text-[10px] text-muted-foreground">{timeAgo(doc.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
