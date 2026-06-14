import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { db, pool, documents, documentChunks, runMigrations } from "@prism/db";
import { makeTestAuth } from "./setup.js";
import type { Express } from "express";

let app: Express;
let tokenA: string;
let tokenB: string;

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

describe("User isolation", () => {
  beforeAll(async () => {
    await runMigrations();
    const testAuth = await makeTestAuth();
    app = createApp(testAuth.testJwks);
    tokenA = await testAuth.createTestJWT("user-a");
    tokenB = await testAuth.createTestJWT("user-b");
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

  it("User B cannot see documents uploaded by User A", async () => {
    // User A uploads
    await request(app)
      .post("/documents/ingest")
      .set("Authorization", `Bearer ${tokenA}`)
      .attach("file", Buffer.from("secret document content"), {
        filename: "secret.txt",
        contentType: "text/plain",
      });

    // User B lists
    const res = await request(app).get("/documents").set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it("User A sees only their own documents", async () => {
    // User A uploads
    await request(app)
      .post("/documents/ingest")
      .set("Authorization", `Bearer ${tokenA}`)
      .attach("file", Buffer.from("user a content"), {
        filename: "a.txt",
        contentType: "text/plain",
      });

    // User A lists — sees their own doc
    const resA = await request(app).get("/documents").set("Authorization", `Bearer ${tokenA}`);
    expect(resA.status).toBe(200);
    expect(resA.body).toHaveLength(1);
    expect(resA.body[0].name).toBe("a.txt");
  });
});
