import express, { type Express } from "express";
import cors from "cors";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: process.env.WEB_URL ?? "http://localhost:5173",
      credentials: true,
    })
  );

  // Better Auth handles its own body parsing internally
  app.all("/auth/*", toNodeHandler(auth));

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}
