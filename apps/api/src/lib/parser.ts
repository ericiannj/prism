import pdf from "pdf-parse";

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "txt" || ext === "md") {
    return buffer.toString("utf-8");
  }

  if (ext === "pdf") {
    const data = await pdf(buffer);
    return data.text;
  }

  throw new Error(`Unsupported file type: .${ext}`);
}
