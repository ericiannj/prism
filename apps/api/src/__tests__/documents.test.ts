import { describe, it, expect, beforeAll, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { db, documents, documentChunks, runMigrations } from "@prism/db";
import { makeTestAuth } from "./setup.js";
import type { Express } from "express";

let app: Express;
let token: string;

describe("Documents routes (integration)", () => {
  beforeAll(async () => {
    await runMigrations();
    const testAuth = await makeTestAuth();
    app = createApp(testAuth.testJwks);
    token = await testAuth.createTestJWT("doc-delete-user");
  });

  afterEach(async () => {
    await db.delete(documentChunks);
    await db.delete(documents);
  });

  async function seedDocument(userId: string) {
    const [doc] = await db
      .insert(documents)
      .values({ userId, name: "seed.pdf", type: "pdf", sizeBytes: 1024, status: "ready" })
      .returning();
    await db.insert(documentChunks).values({
      documentId: doc.id,
      userId,
      content: "seed chunk",
      embedding: Array<number>(1536).fill(0.1),
      chunkIndex: 0,
    });
    return doc;
  }

  it("DELETE /documents/:id returns 204 and removes document and chunks", async () => {
    const doc = await seedDocument("doc-delete-user");

    const res = await request(app)
      .delete(`/documents/${doc.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);

    const remaining = await db.select().from(documents);
    expect(remaining).toHaveLength(0);

    const chunks = await db.select().from(documentChunks);
    expect(chunks).toHaveLength(0);
  });

  it("DELETE /documents/:id returns 404 when document does not exist", async () => {
    const res = await request(app)
      .delete("/documents/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("DELETE /documents/:id returns 404 for another user's document", async () => {
    const doc = await seedDocument("doc-other-user");

    const res = await request(app)
      .delete(`/documents/${doc.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);

    const remaining = await db.select().from(documents);
    expect(remaining).toHaveLength(1);
  });

  it("DELETE /documents/:id returns 401 without a token", async () => {
    const doc = await seedDocument("doc-delete-user");
    const res = await request(app).delete(`/documents/${doc.id}`);
    expect(res.status).toBe(401);
  });
});
