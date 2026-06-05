import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { db, pool, documents, documentChunks, runMigrations } from "@prism/db";

const app = createApp();

function fakeEmbedding(val: number) {
  return Array<number>(1536).fill(val);
}

function mockFetch(ok: boolean, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

describe("Document ingestion pipeline (integration)", () => {
  beforeAll(async () => {
    await runMigrations();
    process.env.OPENROUTER_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      mockFetch(true, {
        data: [
          { embedding: fakeEmbedding(0.1), index: 0 },
          { embedding: fakeEmbedding(0.2), index: 1 },
          { embedding: fakeEmbedding(0.3), index: 2 },
        ],
      })
    );
  });

  afterEach(async () => {
    await db.delete(documentChunks);
    await db.delete(documents);
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    delete process.env.OPENROUTER_API_KEY;
    await pool.end();
  });

  it("POST /documents/ingest ingests a .txt file end-to-end", async () => {
    const content = "The quick brown fox jumps over the lazy dog.\n".repeat(3);

    const res = await request(app).post("/documents/ingest").attach("file", Buffer.from(content), {
      filename: "test.txt",
      contentType: "text/plain",
    });

    expect(res.status).toBe(201);
    expect(res.body.document.status).toBe("ready");
    expect(res.body.document.name).toBe("test.txt");
    expect(res.body.document.type).toBe("txt");

    const chunks = await db.select().from(documentChunks);
    expect(chunks.length).toBeGreaterThan(0);
    const embedding = chunks[0].embedding as number[];
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(1536);
    expect(chunks[0].content).toBeTruthy();
    expect(chunks[0].userId).toBe(process.env.DEV_USER_ID);
  });

  it("GET /documents returns empty array when no documents exist", async () => {
    const res = await request(app).get("/documents");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("GET /documents returns the ingested document", async () => {
    await request(app).post("/documents/ingest").attach("file", Buffer.from("Hello, world!"), {
      filename: "hello.txt",
      contentType: "text/plain",
    });

    const res = await request(app).get("/documents");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("hello.txt");
    expect(res.body[0].status).toBe("ready");
  });

  it("POST /documents/ingest returns 400 for unsupported file type", async () => {
    const res = await request(app).post("/documents/ingest").attach("file", Buffer.from("fake"), {
      filename: "image.jpg",
      contentType: "image/jpeg",
    });

    expect(res.status).toBe(400);
    const allDocs = await db.select().from(documents);
    expect(allDocs).toHaveLength(0);
  });
});
