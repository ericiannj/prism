import { db, documents, documentChunks } from "@prism/db";
import { eq } from "drizzle-orm";
import { extractText } from "../lib/parser.js";
import { chunkText } from "../lib/chunker.js";
import { embedTexts } from "../lib/embedder.js";

function getDocumentType(filename: string): "pdf" | "txt" | "md" {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "md") return "md";
  return "txt";
}

export async function ingestDocument(
  file: { buffer: Buffer; originalname: string; size: number },
  userId: string
): Promise<typeof documents.$inferSelect> {
  const result = await db
    .insert(documents)
    .values({
      userId,
      name: file.originalname,
      type: getDocumentType(file.originalname),
      sizeBytes: file.size,
      status: "processing",
    })
    .returning();
  const doc = result[0];
  if (!doc) throw new Error("Document insert returned no row");

  try {
    const text = await extractText(file.buffer, file.originalname);
    const chunks = chunkText(text);
    const embeddings = await embedTexts(chunks.map((c) => c.content));

    await db.insert(documentChunks).values(
      chunks.map((chunk, i) => ({
        documentId: doc.id,
        userId,
        content: chunk.content,
        embedding: embeddings[i]!,
        chunkIndex: i,
        metadata: { charStart: chunk.charStart, charEnd: chunk.charEnd },
      }))
    );

    const [updated] = await db
      .update(documents)
      .set({ status: "ready" })
      .where(eq(documents.id, doc.id))
      .returning();

    if (!updated) throw new Error("Document update returned no row");
    return updated;
  } catch (error) {
    await db.update(documents).set({ status: "error" }).where(eq(documents.id, doc.id));
    throw error;
  }
}
