# RAG Enterprise Platform — Design Spec

**Date:** 2026-05-25  
**Status:** Approved

---

## Overview

A full-stack RAG platform where users upload documents, embed them into a personal vector store, and query a chat interface that retrieves from three sources: the model's own training (parametric), the user's embedded documents (pgvector), and the web (Tavily). Every chat message records which source was used — this is the core differentiator.

---

## Monorepo Structure

```
apps/
  web/       # React + Vite + Tailwind + shadcn — the user-facing frontend
  api/       # Express — AI/RAG logic, document ingestion, chat orchestration
  auth/      # Express — Better Auth server, issues JWTs, handles OAuth
packages/
  ui/        # Shared shadcn components, consumed by apps/web
  db/        # Drizzle schema, migrations, and database client
```

**Runtime:** Three independent Node processes. `web` runs on port 5173, `api` on 3000, `auth` on 3001.

`packages/db` is the single source of truth for the database schema. Both `apps/api` and `apps/auth` import the Drizzle client from it.

---

## Service Communication

```
web → auth   login/register/OAuth → receives JWT
web → api    all requests carry JWT in Authorization header
api          validates JWT locally using shared HMAC secret
api → OpenRouter   LLM calls (tool use, embeddings)
api → Tavily       when search_web tool is invoked
api → PostgreSQL   document chunks, chat sessions, messages
auth → PostgreSQL  users, sessions (managed by Better Auth)
```

The frontend never calls the database directly. Auth and API are independent services; `api` validates JWTs locally using the same `JWT_SECRET` env var that `auth` uses to sign them — no runtime call to `auth` per request.

**Pre-auth development (v0.2–v0.4):** Before v0.5 is implemented, `apps/api` uses a hardcoded `DEV_USER_ID` env var as the `userId` for all requests. This allows the full RAG pipeline to be built and tested without auth scaffolding.

---

## Database Schema

### Managed by apps/auth (Better Auth generates these)

**users**
| column | type |
|--------|------|
| id | text (PK) |
| email | text UNIQUE NOT NULL |
| name | text |
| emailVerified | boolean |
| image | text |
| createdAt | timestamp |
| updatedAt | timestamp |

**sessions**
| column | type |
|--------|------|
| id | text (PK) |
| userId | text → users.id |
| token | text UNIQUE |
| expiresAt | timestamp |
| ipAddress | text |
| userAgent | text |
| createdAt | timestamp |

### Managed by apps/api (defined in packages/db)

**documents**
| column | type | notes |
|--------|------|-------|
| id | uuid (PK) | |
| userId | text → users.id | owner, required |
| name | text | original filename |
| type | enum: pdf, txt, md | |
| sizeBytes | integer | |
| status | enum: processing, ready, error | updated during ingestion |
| createdAt | timestamp | |

**document_chunks**
| column | type | notes |
|--------|------|-------|
| id | uuid (PK) | |
| documentId | uuid → documents.id | cascade delete |
| userId | text → users.id | denormalized for query isolation |
| content | text | chunk text |
| embedding | vector(1536) | text-embedding-3-small |
| chunkIndex | integer | order within document |
| metadata | jsonb | page number, char offsets, etc. |

Indexes: `hnsw(embedding vector_cosine_ops)`, `(userId)`.  
**Every vector search filters by `userId` before computing similarity** — cross-user data leakage is impossible at the query level.

**chat_sessions**
| column | type |
|--------|------|
| id | uuid (PK) |
| userId | text → users.id |
| title | text |
| createdAt | timestamp |

**messages**
| column | type | notes |
|--------|------|-------|
| id | uuid (PK) | |
| sessionId | uuid → chat_sessions.id | |
| role | enum: user, assistant | |
| content | text | |
| source | enum: parametric, embeddings, web, mixed | null for user messages |
| toolCalls | jsonb | full tool call payloads for audit |
| createdAt | timestamp | |

---

## AI Agent Architecture

The agent runs inside `apps/api`. It uses the OpenRouter API directly (no SDK abstraction) to learn the raw tool use loop.

### Tool Use Loop

```
1. api receives POST /chat with { sessionId, message }
2. api builds messages array (history + new user message)
3. api sends to OpenRouter with two tools declared:
     - search_embeddings: { query: string, limit?: number }
     - search_web: { query: string }
4. LLM responds:
     a. tool_use block → api executes the tool → result appended to messages → back to step 3
     b. text block → final response, loop ends
5. api records which tools were called:
     - no tools called     → source = "parametric"
     - search_embeddings   → source = "embeddings"
     - search_web          → source = "web"
     - both                → source = "mixed"
6. message + source + toolCalls saved to DB
7. streaming response (SSE) sent to web
```

**Telemetry is a structural property of the loop**, not a post-hoc classification. The source is determined by which tools the LLM actually invoked.

### Tool Implementations

`search_embeddings(query, limit=5)` — generates an embedding for `query` via OpenRouter, runs cosine similarity search against `document_chunks` filtered by `userId`, returns top-k chunk contents.

`search_web(query)` — calls Tavily Search API, returns top results with title, URL, and snippet.

---

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/login` | Email/password login + Google OAuth |
| `/register` | New account creation |
| `/change-password` | Authenticated, change password |
| `/documents` | List ingested documents + upload new ones |
| `/chat` | Chat interface with telemetry badges per message |

Chat telemetry badge colors: gray = parametric, green = embeddings, blue = web, purple = mixed. Badge is expandable to show the chunks/snippets that were used.

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Monorepo | Turborepo + pnpm | Standard, fast, good TS support |
| Language | TypeScript (strict) | End-to-end type safety |
| Frontend | React + Vite | Fast dev server, ecosystem |
| Styling | Tailwind CSS + shadcn/ui | Consistent design system |
| Icons | Lucide | Consistent with shadcn |
| Backend | Express.js | Minimal, explicit, good for learning |
| ORM | Drizzle | SQL-first, transparent, pgvector-friendly |
| Database | PostgreSQL + pgvector | Vector search collocated with relational data |
| Auth | Better Auth | TypeScript-native, Drizzle adapter, OAuth built-in |
| LLM | OpenRouter | Provider-agnostic, manual API calls for learning |
| Embeddings | OpenAI text-embedding-3-small via OpenRouter | 1536 dims, cost-effective |
| Web search | Tavily | Purpose-built for LLM agents |
| Testing | Vitest + React Testing Library | Fast, native ESM |
| Git hooks | Husky + lint-staged | Enforce quality before commit |
| Containerization | Docker Compose (local dev) | Postgres + pgvector in one command |

---

## Delivery Stages

### v0.1 — Foundation
Goal: monorepo runs, tests pass, database connects.

- Turborepo + pnpm workspaces + TypeScript config
- ESLint, Prettier, Husky, lint-staged
- `apps/web`: Vite + React + Tailwind skeleton
- `apps/api`: Express + health endpoint
- `apps/auth`: Express + health endpoint  
- `packages/ui`: shadcn init
- `packages/db`: Drizzle setup + pgvector extension
- Docker Compose: PostgreSQL with pgvector
- Vitest config in every package/app

### v0.2 — Document Ingestion
Goal: upload a PDF, see chunks stored in pgvector.

- Drizzle schema: `documents`, `document_chunks`
- PDF parsing with pdf-parse; plain text and markdown support
- Fixed-size chunking with configurable overlap
- Embedding generation via OpenRouter
- `POST /documents/ingest` and `GET /documents` endpoints
- Documents page: upload form + document list
- Integration tests for the full ingestion pipeline

### v0.3 — RAG Chat (embeddings only)
Goal: chat that retrieves from your own documents with partial telemetry.

- Drizzle schema: `chat_sessions`, `messages`
- OpenRouter LLM call with manual tool use loop
- `search_embeddings` tool implementation
- SSE streaming response to frontend
- `messages.source` recorded (parametric or embeddings)
- Chat UI with streaming display
- Telemetry badge per assistant message
- Tests: tool call flow, source recording

### v0.4 — Web Search + Full Telemetry
Goal: all three sources working, telemetry visible in the chat UI.

- `search_web` tool via Tavily API
- `source: "web"` and `source: "mixed"` detection
- Telemetry panel with color-coded source badges
- `toolCalls` jsonb saved to `messages`
- Expandable badge showing retrieved chunks/snippets
- Tests: Tavily tool, mixed source detection

### v0.5 — Authentication
Goal: multi-user system with per-user data isolation enforced.

- `apps/auth`: Better Auth setup + JWT signing (jose)
- Login, register, change password, Google OAuth
- `apps/api`: JWT validation middleware applied to all routes
- `userId` injected into all database queries
- Per-user embedding isolation verified with tests
- Auth pages UI; protected routes on the frontend

### v0.6 — Polish
Goal: production-ready, fully tested, portfolio-presentable.

- Error boundaries + toast notifications
- Loading states across all async flows
- RTL component tests for web
- Vitest coverage report
- Delete document with cascade chunk deletion
- Rename chat session
- CLAUDE.md with project instructions for AI agents
- README and docker-compose for production-like setup
