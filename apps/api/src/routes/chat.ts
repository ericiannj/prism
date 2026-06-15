import { type IRouter, Router } from "express";
import { db, chatSessions, messages } from "@prism/db";
import { eq, desc, asc, and } from "drizzle-orm";
import {
  runAgentLoop,
  getOrCreateSession,
  loadHistory,
  persistExchange,
  SYSTEM_PROMPT,
} from "../services/chat.js";
import type { AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();

/**
 * @swagger
 * /chat:
 *   post:
 *     summary: Send a message and receive a Server-Sent Events stream
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: The user's message text
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Existing session ID. Omit to start a new session.
 *     responses:
 *       '200':
 *         description: >
 *           Server-Sent Events stream (Content-Type: text/event-stream).
 *           Each event is newline-delimited JSON prefixed with "data: ".
 *           Event shapes:
 *           { "type": "token", "content": "string" } — LLM text fragment;
 *           { "type": "done", "sessionId": "uuid", "source": "parametric|rag|web", "toolCalls": ["string"] } — end of stream;
 *           { "type": "error", "error": "string" } — on failure.
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       '400':
 *         description: Message is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", async (req, res) => {
  const { sessionId, message } = req.body as {
    sessionId?: string;
    message: string;
  };

  if (!message?.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  const userId = (req as AuthRequest).userId;

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
      `data: ${JSON.stringify({ type: "done", sessionId: resolvedSessionId, source, toolCalls })}\n\n`
    );
  } catch {
    res.write(`data: ${JSON.stringify({ type: "error", error: "Chat failed" })}\n\n`);
  } finally {
    res.end();
  }
});

/**
 * @swagger
 * /chat/sessions:
 *   get:
 *     summary: List chat sessions for the current user
 *     tags: [Chat]
 *     responses:
 *       '200':
 *         description: Array of chat sessions ordered by creation date (newest first)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatSession'
 *       '500':
 *         description: Failed to fetch sessions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/sessions", async (req, res) => {
  const userId = (req as AuthRequest).userId;
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

/**
 * @swagger
 * /chat/{id}/messages:
 *   get:
 *     summary: Get messages for a chat session
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The chat session ID
 *     responses:
 *       '200':
 *         description: Array of messages ordered by creation date (oldest first)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       '500':
 *         description: Failed to fetch messages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id/messages", async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const sessionId = req.params.id;

    // Verify the session belongs to this user
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.createdAt));

    return res.json(msgs);
  } catch {
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.patch("/sessions/:id", async (req, res) => {
  const userId = (req as AuthRequest).userId;
  const { id } = req.params;
  const { title } = req.body as { title?: string };

  if (!title?.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  const [existing] = await db
    .select({ id: chatSessions.id })
    .from(chatSessions)
    .where(and(eq(chatSessions.id, id), eq(chatSessions.userId, userId)))
    .limit(1);

  if (!existing) {
    return res.status(404).json({ error: "Session not found" });
  }

  const [updated] = await db
    .update(chatSessions)
    .set({ title: title.trim() })
    .where(and(eq(chatSessions.id, id), eq(chatSessions.userId, userId)))
    .returning();

  return res.json(updated);
});

export { router as chatRouter };
