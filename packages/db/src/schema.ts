import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  index,
  jsonb,
  vector,
} from "drizzle-orm/pg-core";

export const documentTypeEnum = pgEnum("document_type", ["pdf", "txt", "md"]);
export const documentStatusEnum = pgEnum("document_status", ["processing", "ready", "error"]);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    type: documentTypeEnum("type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    status: documentStatusEnum("status").notNull().default("processing"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("documents_user_id_idx").on(table.userId)]
);

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("document_chunks_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
    index("document_chunks_user_id_idx").on(table.userId),
  ]
);
