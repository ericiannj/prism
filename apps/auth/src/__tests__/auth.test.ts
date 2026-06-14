import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { db, pool, user, verification } from "@prism/db";

const app = createApp();

beforeAll(async () => {
  // Ensure tables exist (migration already ran — this is a safety check)
  await db
    .select()
    .from(user)
    .limit(1)
    .catch(() => {
      throw new Error(
        "Better Auth tables not found. Run: pnpm --filter @prism/db exec drizzle-kit migrate"
      );
    });
});

afterEach(async () => {
  // Cascade: deleting user removes session + account entries
  await db.delete(verification);
  await db.delete(user);
});

afterAll(async () => {
  await pool.end();
});

describe("Better Auth — email/password", () => {
  it("POST /auth/sign-up/email creates a user and returns a session", async () => {
    const agent = request.agent(app);
    const res = await agent.post("/auth/sign-up/email").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("test@example.com");
    // Better Auth sign-up returns { token, user } — token is the session token string
    expect(res.body.token).toBeTruthy();
  });

  it("POST /auth/sign-in/email with wrong password returns 4xx", async () => {
    const agent = request.agent(app);
    // Register first
    await agent.post("/auth/sign-up/email").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    const res = await agent.post("/auth/sign-in/email").send({
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("GET /auth/token returns a JWT after sign-in", async () => {
    const agent = request.agent(app);
    await agent.post("/auth/sign-up/email").send({
      name: "Test User",
      email: "token@example.com",
      password: "password123",
    });

    const res = await agent.get("/auth/token");

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.split(".")).toHaveLength(3); // valid JWT format
  });

  it("POST /auth/sign-out invalidates the session", async () => {
    const agent = request.agent(app);
    await agent.post("/auth/sign-up/email").send({
      name: "Test User",
      email: "logout@example.com",
      password: "password123",
    });

    const signOut = await agent.post("/auth/sign-out");
    expect(signOut.status).toBe(200);

    // Token endpoint should now return 401
    const tokenAfter = await agent.get("/auth/token");
    expect(tokenAfter.status).toBe(401);
  });
});
