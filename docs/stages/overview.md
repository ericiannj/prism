# Implementation Plan — Stages Overview

Six incremental stages. Each one must be fully tested before the next begins.
Details for each stage are in the individual files linked below.

## Flow

```
v0.1 Foundation
  └─ monorepo boots, DB connects, tests pass
       ↓
v0.2 Document Ingestion
  └─ upload PDF → chunks + embeddings stored in pgvector
  └─ uses DEV_USER_ID (no auth yet)
       ↓
v0.3 RAG Chat (embeddings only)
  └─ chat retrieves from uploaded docs
  └─ tool use loop implemented from scratch
  └─ messages.source: parametric | embeddings
       ↓
v0.4 Web Search + Full Telemetry
  └─ adds search_web tool (Tavily)
  └─ messages.source: web | mixed
  └─ expandable telemetry badges in the UI
       ↓
v0.5 Authentication
  └─ Better Auth: email/password + Google OAuth
  └─ JWT validation middleware on all api routes
  └─ DEV_USER_ID removed; per-user data isolation enforced
       ↓
v0.6 Polish
  └─ error boundaries, toasts, loading states
  └─ delete document, rename chat session
  └─ coverage report, README, prod docker-compose
```

## Stage Files

| Stage | File | Goal |
|-------|------|------|
| v0.1 | [v0.1-foundation.md](v0.1-foundation.md) | Monorepo runs, DB connects |
| v0.2 | [v0.2-document-ingestion.md](v0.2-document-ingestion.md) | Upload PDF → chunks in pgvector |
| v0.3 | [v0.3-rag-chat.md](v0.3-rag-chat.md) | Chat with embeddings + telemetry |
| v0.4 | [v0.4-web-search.md](v0.4-web-search.md) | Web search + full telemetry |
| v0.5 | [v0.5-auth.md](v0.5-auth.md) | Multi-user auth + data isolation |
| v0.6 | [v0.6-polish.md](v0.6-polish.md) | Production-ready + portfolio-ready |

## Rules for Agents

- Implement one stage at a time. Read the stage file before writing any code.
- A stage is complete only when **all manual tests pass** and `pnpm test` exits 0.
- Do not carry forward incomplete work — if a stage is blocked, surface it instead of continuing.
- The pre-auth shortcut (`DEV_USER_ID`) is intentional for v0.2–v0.4. Do not wire auth before v0.5.
- Check [architecture.md](../architecture.md) for schema, routes, and the agent loop before implementing anything in `apps/api`.
