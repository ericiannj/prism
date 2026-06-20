import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { createRemoteJWKSet, type JWTVerifyGetKey } from "jose";
import { documentsRouter } from "./routes/documents.js";
import { chatRouter } from "./routes/chat.js";
import { swaggerSpec } from "./swagger.js";
import { makeRequireAuth } from "./middleware/auth.js";

export function createApp(jwks?: JWTVerifyGetKey): Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env.WEB_URL ?? "http://localhost:5173" }));
  app.use(express.json());

  const activeJwks =
    jwks ??
    createRemoteJWKSet(
      new URL(`${process.env.BETTER_AUTH_URL ?? "http://localhost:3001"}/auth/jwks`)
    );
  const requireAuth = makeRequireAuth(activeJwks);

  app.get("/api-docs.json", (_req, res) => {
    res.json(swaggerSpec);
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const chatLimiter = rateLimit({
    windowMs: 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });
  const ingestLimiter = rateLimit({
    windowMs: 60_000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.post("/documents/ingest", ingestLimiter);
  app.use("/documents", requireAuth, documentsRouter);
  app.use("/chat", requireAuth, chatLimiter, chatRouter);

  return app;
}
