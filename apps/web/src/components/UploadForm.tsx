import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@prism/ui";
import { toast } from "sonner";
import { ingest } from "../lib/api";

interface Props {
  onSuccess: () => void;
}

export function UploadForm({ onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      await ingest(file);
      if (inputRef.current) inputRef.current.value = "";
      onSuccess();
      toast.success("Document ingested", { description: file.name });
    } catch (err) {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setUploading(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    await upload(file);
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await upload(file);
  }

  return (
    <div
      data-testid="drop-zone"
      className={`rounded-xl border-[1.5px] border-dashed transition-colors ${
        isDragging
          ? "border-primary/60 bg-primary/10"
          : "border-primary/25 bg-gradient-to-b from-primary/[0.06] to-transparent"
      }`}
      onDragOver={(e) => handleDragOver(e)}
      onDragLeave={(e) => handleDragLeave(e)}
      onDrop={(e) => void handleDrop(e)}
    >
      <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
        <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Drop files here</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, .txt or .md · Max 10 MB</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 shadow-none"
          >
            {uploading ? "Uploading…" : "Browse files"}
          </Button>
          <span className="text-xs text-muted-foreground/50">or drag & drop</span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md"
        className="hidden"
        onChange={(e) => void handleChange(e)}
      />
    </div>
  );
}
