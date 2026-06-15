import { type IRouter, Router } from "express";
import multer from "multer";
import { db, documents, documentChunks } from "@prism/db";
import { eq, desc, count, and } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm/utils";
import { ingestDocument } from "../services/ingestion.js";
import type { AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const SUPPORTED_EXTENSIONS = [".pdf", ".txt", ".md"];

/**
 * @swagger
 * /documents/ingest:
 *   post:
 *     summary: Ingest a document into the vector store
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "Supported formats: .pdf, .txt, .md (max 10 MB)"
 *     responses:
 *       '201':
 *         description: Document ingested and chunked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 document:
 *                   $ref: '#/components/schemas/Document'
 *       '400':
 *         description: No file provided or unsupported file type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Ingestion failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
    const userId = (req as AuthRequest).userId;
    try {
      const document = await ingestDocument(req.file, userId);
      return res.status(201).json({ document });
    } catch {
      return res.status(500).json({ error: "Ingestion failed" });
    }
  }
);

/**
 * @swagger
 * /documents:
 *   get:
 *     summary: List all documents for the current user
 *     tags: [Documents]
 *     responses:
 *       '200':
 *         description: Array of documents with chunk counts, ordered by creation date (newest first)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DocumentWithChunks'
 *       '500':
 *         description: Failed to fetch documents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", async (req, res) => {
  const userId = (req as AuthRequest).userId;
  try {
    const docs = await db
      .select({
        ...getTableColumns(documents),
        chunkCount: count(documentChunks.id),
      })
      .from(documents)
      .leftJoin(documentChunks, eq(documentChunks.documentId, documents.id))
      .where(eq(documents.userId, userId))
      .groupBy(documents.id)
      .orderBy(desc(documents.createdAt));
    return res.json(docs);
  } catch {
    return res.status(500).json({ error: "Failed to fetch documents" });
  }
});

router.delete("/:id", async (req, res) => {
  const userId = (req as AuthRequest).userId;
  const { id } = req.params;

  const [existing] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, userId)))
    .limit(1);

  if (!existing) {
    return res.status(404).json({ error: "Document not found" });
  }

  await db.delete(documents).where(and(eq(documents.id, id), eq(documents.userId, userId)));

  return res.status(204).send();
});

export { router as documentsRouter };
