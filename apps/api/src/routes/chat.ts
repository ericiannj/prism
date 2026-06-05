import { type IRouter, Router } from "express";
import { db, chatSessions, messages } from "@prism/db";
import { eq, desc, asc } from "drizzle-orm";
import {
  runAgentLoop,
  getOrCreateSession,
  loadHistory,
  persistExchange,
  SYSTEM_PROMPT,
} from "../services/chat.js";

const router: IRouter = Router();

router.post("/", async (req, res) => {
  const { sessionId, message } = req.body as {
    sessionId?: string;
    message: string;
  };

  if (!message?.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  const userId = process.env.DEV_USER_ID ?? "dev-user-1";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const resolvedSessionId = await getOrCreateSession(sessionId, userId, message);
    const history = await loadHistory(resolvedSessionId);

    const conversationMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...history,
      { role: "user" as const, content: message },
    ];

    const { content, source, toolCalls } = await runAgentLoop(conversationMessages, userId);

    res.write(`data: ${JSON.stringify({ type: "token", content })}\n\n`);

    await persistExchange(resolvedSessionId, message, content, source, toolCalls);

    res.write(
      `data: ${JSON.stringify({ type: "done", sessionId: resolvedSessionId, source })}\n\n`
    );
  } catch {
    res.write(`data: ${JSON.stringify({ type: "error", error: "Chat failed" })}\n\n`);
  } finally {
    res.end();
  }
});

router.get("/sessions", async (_req, res) => {
  const userId = process.env.DEV_USER_ID ?? "dev-user-1";
  try {
    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.createdAt));
    return res.json(sessions);
  } catch {
    return res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

router.get("/:id/messages", async (req, res) => {
  try {
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, req.params.id))
      .orderBy(asc(messages.createdAt));
    return res.json(msgs);
  } catch {
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
});

export { router as chatRouter };
