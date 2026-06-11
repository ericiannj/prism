import express, { type Express } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { documentsRouter } from "./routes/documents.js";
import { chatRouter } from "./routes/chat.js";
import { swaggerSpec } from "./swagger.js";

export function createApp(): Express {
  const app = express();
  app.use(cors({ origin: "http://localhost:5173" }));
  app.use(express.json());

  app.get("/api-docs.json", (_req, res) => {
    res.json(swaggerSpec);
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/documents", documentsRouter);
  app.use("/chat", chatRouter);

  return app;
}
