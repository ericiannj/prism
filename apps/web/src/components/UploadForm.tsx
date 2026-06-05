import { useRef, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@prism/ui";
import { toast } from "sonner";
import { ingest } from "../lib/api";

interface Props {
  onSuccess: () => void;
}

export function UploadForm({ onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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

  return (
    <div className="rounded-lg border border-border border-dashed bg-surface p-5 flex items-center gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
        <FileText className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Upload a document</p>
        <p className="text-xs text-muted-foreground mt-0.5">PDF, .txt or .md · Max 10 MB</p>
      </div>
      <Button type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? "Uploading…" : "Choose file"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
