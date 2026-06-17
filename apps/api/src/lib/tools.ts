import { db, documentChunks } from "@prism/db";
import { eq, sql } from "drizzle-orm";
import { embedTexts } from "./embedder.js";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

interface TavilyResponse {
  results: TavilyResult[];
}

export const TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "search_embeddings",
      description:
        "Search the user's personal document library for content relevant to the query. Call this FIRST for any question — the user may have uploaded documents on this topic. Prefer this over web search.",
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
  {
    type: "function" as const,
    function: {
      name: "search_web",
      description:
        "Search the web for current information, recent news, or external data. Use only when search_embeddings returned no relevant results or the user explicitly asks for real-time/external information.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query.",
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
  const embeddings = await embedTexts([query]);
  const queryEmbedding = embeddings.at(0);
  if (!queryEmbedding) throw new Error("Failed to generate query embedding");
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

export async function executeSearchWeb(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not set");

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, query, max_results: 5 }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Tavily search failed: ${body}`);
  }

  const data = (await response.json()) as TavilyResponse;
  const results = Array.isArray(data.results) ? data.results : [];
  if (!results.length) return "No web results found.";

  return results.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.content}`).join("\n\n");
}
