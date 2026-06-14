import express, { type Express } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { createRemoteJWKSet, type JWTVerifyGetKey } from "jose";
import { documentsRouter } from "./routes/documents.js";
import { chatRouter } from "./routes/chat.js";
import { swaggerSpec } from "./swagger.js";
import { makeRequireAuth } from "./middleware/auth.js";

export function createApp(jwks?: JWTVerifyGetKey): Express {
  const app = express();
  app.use(cors({ origin: "http://localhost:5173" }));
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

  app.use("/documents", requireAuth, documentsRouter);
  app.use("/chat", requireAuth, chatRouter);

  return app;
}
