import { db, chatSessions, messages } from "@prism/db";
import { eq, asc } from "drizzle-orm";
import { TOOL_DEFINITIONS, executeSearchEmbeddings } from "../lib/tools.js";

type MessageSource = "parametric" | "embeddings";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface LLMResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }>;
}

export const SYSTEM_PROMPT = `You are a helpful AI assistant with access to the user's personal document library via the search_embeddings tool. When the user asks about their documents, their knowledge base, or topics that might be covered in their uploaded files, call search_embeddings first. For general knowledge questions that don't require their documents, answer directly.`;

async function callOpenRouter(msgs: OpenRouterMessage[]): Promise<LLMResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.CHAT_MODEL ?? "anthropic/claude-3-haiku",
      messages: msgs,
      tools: TOOL_DEFINITIONS,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter LLM call failed: ${body}`);
  }

  return response.json() as Promise<LLMResponse>;
}

export async function runAgentLoop(
  conversationMessages: OpenRouterMessage[],
  userId: string
): Promise<{ content: string; source: MessageSource; toolCalls: ToolCall[] }> {
  const allToolCalls: ToolCall[] = [];
  const toolsUsed = new Set<string>();
  const loop = [...conversationMessages];

  while (true) {
    const response = await callOpenRouter(loop);
    const choice = response.choices[0];
    if (!choice) throw new Error("Empty response from LLM");

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls?.length) {
      const toolCalls = choice.message.tool_calls;
      allToolCalls.push(...toolCalls);
      loop.push({ role: "assistant", content: null, tool_calls: toolCalls });

      for (const tc of toolCalls) {
        toolsUsed.add(tc.function.name);
        const args = JSON.parse(tc.function.arguments) as {
          query: string;
          limit?: number;
        };
        const result = await executeSearchEmbeddings(args.query, userId, args.limit ?? 5);
        loop.push({ role: "tool", content: result, tool_call_id: tc.id });
      }
    } else {
      const content = choice.message.content ?? "";
      const source: MessageSource = toolsUsed.has("search_embeddings")
        ? "embeddings"
        : "parametric";
      return { content, source, toolCalls: allToolCalls };
    }
  }
}

export async function getOrCreateSession(
  sessionId: string | undefined,
  userId: string,
  firstMessage: string
): Promise<string> {
  if (sessionId) return sessionId;
  const title = firstMessage.slice(0, 60);
  const [session] = await db.insert(chatSessions).values({ userId, title }).returning();
  if (!session) throw new Error("Session insert returned no row");
  return session.id;
}

export async function loadHistory(sessionId: string): Promise<OpenRouterMessage[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(asc(messages.createdAt));

  return rows.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
}

export async function persistExchange(
  sessionId: string,
  userContent: string,
  assistantContent: string,
  source: MessageSource,
  toolCalls: ToolCall[]
): Promise<void> {
  await db.insert(messages).values([
    { sessionId, role: "user", content: userContent },
    {
      sessionId,
      role: "assistant",
      content: assistantContent,
      source,
      toolCalls: toolCalls.length > 0 ? toolCalls : null,
    },
  ]);
}
