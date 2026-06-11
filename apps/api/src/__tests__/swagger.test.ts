import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

describe("Swagger endpoints", () => {
  it("GET /api-docs returns the Swagger UI HTML", async () => {
    const res = await request(app).get("/api-docs").redirects(1);
    expect(res.status).toBe(200);
    expect(res.text).toContain("swagger-ui");
  });

  it("GET /api-docs.json returns a valid OpenAPI 3.0 spec", async () => {
    const res = await request(app).get("/api-docs.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.0");
    expect(res.body.info.title).toBe("Prism API");
    expect(res.body.paths).toHaveProperty("/documents/ingest");
    expect(res.body.paths).toHaveProperty("/documents");
    expect(res.body.paths).toHaveProperty("/chat");
    expect(res.body.paths).toHaveProperty("/chat/sessions");
    expect(res.body.paths).toHaveProperty("/chat/{id}/messages");
  });
});
