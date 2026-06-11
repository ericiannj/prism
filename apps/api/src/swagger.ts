import swaggerJsdoc from "swagger-jsdoc";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Prism API",
      version: "0.1.0",
      description:
        "RAG platform — document ingestion, pgvector search, and LLM chat with source telemetry.",
    },
    servers: [{ url: "http://localhost:3000", description: "Local dev" }],
    components: {
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
        Document: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string" },
            filename: { type: "string" },
            mimeType: { type: "string" },
            size: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        DocumentWithChunks: {
          allOf: [
            { $ref: "#/components/schemas/Document" },
            {
              type: "object",
              properties: {
                chunkCount: { type: "integer" },
              },
            },
          ],
        },
        ChatSession: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string" },
            title: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Message: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            sessionId: { type: "string", format: "uuid" },
            role: { type: "string", enum: ["user", "assistant"] },
            content: { type: "string" },
            source: {
              type: "string",
              enum: ["parametric", "rag", "web"],
              nullable: true,
            },
            toolCalls: {
              type: "array",
              items: { type: "string" },
              nullable: true,
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: [join(__dir, "routes", "*.ts")],
};

export const swaggerSpec = swaggerJsdoc(options);
