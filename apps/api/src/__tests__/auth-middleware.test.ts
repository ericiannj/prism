import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import express from "express";
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT, type JWTVerifyGetKey } from "jose";
import { makeRequireAuth } from "../middleware/auth.js";

let testJwks: JWTVerifyGetKey;
let validToken: string;
const ISSUER = "http://localhost:3001";

beforeAll(async () => {
  process.env.BETTER_AUTH_URL = ISSUER;
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  testJwks = createLocalJWKSet({ keys: [await exportJWK(publicKey)] });
  validToken = await new SignJWT({ sub: "user-abc" })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(ISSUER)
    .setAudience(ISSUER)
    .setExpirationTime("1h")
    .sign(privateKey);
});

function makeTestApp(jwks: JWTVerifyGetKey) {
  const app = express();
  app.use(makeRequireAuth(jwks));
  app.get("/protected", (req, res) => {
    res.json({ userId: (req as { userId: string }).userId });
  });
  return app;
}

describe("requireAuth middleware", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const app = makeTestApp(testJwks);
    const res = await request(app).get("/protected");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("returns 401 when token is malformed", async () => {
    const app = makeTestApp(testJwks);
    const res = await request(app).get("/protected").set("Authorization", "Bearer not.a.valid.jwt");
    expect(res.status).toBe(401);
  });

  it("returns 401 when token is signed with a different key", async () => {
    const { privateKey: otherKey } = await generateKeyPair("RS256");
    const wrongToken = await new SignJWT({ sub: "user-xyz" })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(ISSUER)
      .setAudience(ISSUER)
      .setExpirationTime("1h")
      .sign(otherKey);

    const app = makeTestApp(testJwks);
    const res = await request(app).get("/protected").set("Authorization", `Bearer ${wrongToken}`);
    expect(res.status).toBe(401);
  });

  it("passes with a valid token and injects userId", async () => {
    const app = makeTestApp(testJwks);
    const res = await request(app).get("/protected").set("Authorization", `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe("user-abc");
  });
});
