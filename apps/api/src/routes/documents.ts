import { Router } from "express";
import multer from "multer";
import { db, documents } from "@prism/db";
import { eq, desc } from "drizzle-orm";
import { ingestDocument } from "../services/ingestion.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const SUPPORTED_EXTENSIONS = [".pdf", ".txt", ".md"];

router.post(
  "/ingest",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const ext = "." + req.file.originalname.split(".").pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({ error: "Unsupported file type" });
    }
    const userId = process.env.DEV_USER_ID ?? "dev-user-1";
    try {
      const document = await ingestDocument(req.file, userId);
      return res.status(201).json({ document });
    } catch {
      return res.status(500).json({ error: "Ingestion failed" });
    }
  }
);

router.get("/", async (_req, res) => {
  const userId = process.env.DEV_USER_ID ?? "dev-user-1";
  try {
    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
    return res.json(docs);
  } catch {
    return res.status(500).json({ error: "Failed to fetch documents" });
  }
});

export { router as documentsRouter };
