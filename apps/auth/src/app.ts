import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.WEB_URL ?? "http://localhost:5173",
      credentials: true,
    })
  );

  // Brute-force protection on mutation endpoints only — get-session is excluded
  // because better-auth calls it on every page load
  const authLimiter = rateLimit({
    windowMs: 15 * 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.post("/auth/sign-in/*", authLimiter);
  app.post("/auth/sign-up/*", authLimiter);

  // Better Auth handles its own body parsing internally
  app.all("/auth/*", toNodeHandler(auth));

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}
