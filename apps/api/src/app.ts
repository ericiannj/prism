import express, { type Express } from "express";
import cors from "cors";
import { documentsRouter } from "./routes/documents.js";

export function createApp(): Express {
  const app = express();
  app.use(cors({ origin: "http://localhost:5173" }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/documents", documentsRouter);

  return app;
}
