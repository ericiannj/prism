import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { db, pool, chatSessions, messages, runMigrations } from "@prism/db";

const app = createApp();

function mockLLMResponse(content: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: { role: "assistant", content, tool_calls: undefined },
          finish_reason: "stop",
        },
      ],
    }),
    text: async () => content,
  });
}

describe("Chat routes (integration)", () => {
  beforeAll(async () => {
    await runMigrations();
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await db.delete(messages);
    await db.delete(chatSessions);
  });

  afterAll(async () => {
    delete process.env.OPENROUTER_API_KEY;
    await pool.end();
  });

  it("POST /chat creates a new session and returns SSE with token + done events", async () => {
    vi.stubGlobal("fetch", mockLLMResponse("Hello! How can I help?"));

    const res = await request(app)
      .post("/chat")
      .send({ message: "Hello" })
      .buffer(true)
      .parse((res, callback) => {
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on("end", () => callback(null, data));
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/event-stream/);

    const body = res.body as string;
    expect(body).toContain('"type":"token"');
    expect(body).toContain('"type":"done"');
    expect(body).toContain('"source":"parametric"');
    expect(body).toContain('"sessionId"');
  });

  it("POST /chat persists user + assistant messages in the DB", async () => {
    vi.stubGlobal("fetch", mockLLMResponse("The answer is 42."));

    await request(app)
      .post("/chat")
      .send({ message: "What is the answer?" })
      .buffer(true)
      .parse((res, callback) => {
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on("end", () => callback(null, data));
      });

    const allMessages = await db.select().from(messages);
    expect(allMessages).toHaveLength(2);
    expect(allMessages.find((m) => m.role === "user")?.content).toBe("What is the answer?");
    expect(allMessages.find((m) => m.role === "assistant")?.content).toBe("The answer is 42.");
    expect(allMessages.find((m) => m.role === "assistant")?.source).toBe("parametric");
  });

  it("GET /chat/sessions returns the created sessions", async () => {
    vi.stubGlobal("fetch", mockLLMResponse("Hi!"));

    await request(app)
      .post("/chat")
      .send({ message: "First message" })
      .buffer(true)
      .parse((res, callback) => {
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on("end", () => callback(null, data));
      });

    const res = await request(app).get("/chat/sessions");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe("First message");
  });

  it("GET /chat/:id/messages returns messages for the session", async () => {
    vi.stubGlobal("fetch", mockLLMResponse("Nice to meet you!"));

    let sessionId = "";
    await request(app)
      .post("/chat")
      .send({ message: "Hi there" })
      .buffer(true)
      .parse((res, callback) => {
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          const doneEvent = data
            .split("\n")
            .find((line) => line.startsWith("data:") && line.includes('"done"'));
          if (doneEvent) {
            const parsed = JSON.parse(doneEvent.slice(5)) as { sessionId: string };
            sessionId = parsed.sessionId;
          }
          callback(null, data);
        });
      });

    const res = await request(app).get(`/chat/${sessionId}/messages`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].role).toBe("user");
    expect(res.body[1].role).toBe("assistant");
  });
});
