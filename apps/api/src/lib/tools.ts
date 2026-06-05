import { db, documentChunks } from "@prism/db";
import { eq, sql } from "drizzle-orm";
import { embedTexts } from "./embedder.js";

export const TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "search_embeddings",
      description:
        "Search the user's uploaded documents for content relevant to the query using semantic similarity. Call this when the user asks about their personal documents or knowledge base.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query used to find relevant document chunks.",
          },
          limit: {
            type: "number",
            description: "Maximum number of chunks to return (default: 5).",
          },
        },
        required: ["query"],
      },
    },
  },
] as const;

export async function executeSearchEmbeddings(
  query: string,
  userId: string,
  limit = 5
): Promise<string> {
  const [queryEmbedding] = await embedTexts([query]);
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  const results = await db
    .select({ content: documentChunks.content })
    .from(documentChunks)
    .where(eq(documentChunks.userId, userId))
    .orderBy(sql`${documentChunks.embedding} <=> ${vectorStr}::vector`)
    .limit(limit);

  if (results.length === 0) return "No relevant documents found.";
  return results.map((r, i) => `[${i + 1}] ${r.content}`).join("\n\n");
}
