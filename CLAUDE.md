# Prism — Claude Code Guide

Full-stack RAG platform where users upload documents, embed them into a personal vector store, and query a chat interface that retrieves from three sources: model training (parametric), user documents (pgvector), and the web (Tavily). Every assistant message records which source was used — this is the core differentiator.

## Monorepo Structure

```
apps/
  web/    # React + Vite + Tailwind + shadcn — user-facing frontend (port 5173)
  api/    # Express — AI/RAG logic, document ingestion, chat orchestration (port 3000)
  auth/   # Express — Better Auth server, JWT signing, OAuth (port 3001)
packages/
  ui/     # Shared shadcn components, consumed by apps/web
  db/     # Drizzle schema, migrations, and database client
```

`packages/db` is the single source of truth for the schema. Both `apps/api` and `apps/auth` import the Drizzle client from it.

## Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Monorepo | Turborepo + pnpm workspaces | Standard, fast, good TS support |
| Language | TypeScript (strict) | End-to-end type safety |
| Frontend | React + Vite | Fast dev server, ecosystem |
| Styling | Tailwind CSS + shadcn/ui | Consistent design system |
| Icons | lucide-react | Consistent with shadcn |
| Backend | Express.js | Minimal, explicit, good for learning |
| ORM | Drizzle | SQL-first, transparent, pgvector-friendly |
| Database | PostgreSQL + pgvector | Vector search collocated with relational data |
| Auth | Better Auth (Drizzle adapter) | TypeScript-native, Drizzle adapter, OAuth built-in |
| LLM | OpenRouter (manual API calls — no SDK abstraction) | Provider-agnostic, manual API calls for learning |
| Embeddings | text-embedding-3-small via OpenRouter (1536 dims) | 1536 dims, cost-effective |
| Web search | Tavily | Purpose-built for LLM agents |
| Testing | Vitest + React Testing Library | Fast, native ESM |
| Linting | ESLint + Prettier | — |
| Git hooks | Husky + lint-staged | Enforce quality before commit |
| Containerization | Docker Compose (local dev) | Postgres + pgvector in one command |

## Key Conventions

- **TypeScript strict** across all apps and packages — no `any`, no `ts-ignore`
- **No direct DB calls from `apps/web`** — all data goes through `apps/api`
- **`packages/db` owns the schema** — never define Drizzle tables inside `apps/`
- **`api` validates JWTs locally** — no runtime call to `auth` per request; shared `JWT_SECRET`
- **Pre-auth (v0.2–v0.4):** `apps/api` uses `DEV_USER_ID` env var as `userId` — no auth needed to build and test the RAG pipeline
- **Every `document_chunks` query filters by `userId` first** — cross-user data leakage must be impossible at the query level
- **Telemetry is structural, not post-hoc** — `messages.source` is set by which tools the LLM actually invoked, never inferred after the fact

## Reference Docs

- [Architecture & DB Schema](docs/architecture.md)
- [Stages Overview](docs/stages/overview.md)
- [v0.1 Foundation](docs/stages/v0.1-foundation.md)
- [v0.2 Document Ingestion](docs/stages/v0.2-document-ingestion.md)
- [v0.3 RAG Chat](docs/stages/v0.3-rag-chat.md)
- [v0.4 Web Search + Full Telemetry](docs/stages/v0.4-web-search.md)
- [v0.5 Authentication](docs/stages/v0.5-auth.md)
- [v0.6 Polish](docs/stages/v0.6-polish.md)

## Principles

- **English only.** All code, comments, variable names, type names, and commit messages in English.
- **Simplicity first.** Prefer the smallest change that solves the problem. Touch only what is needed.
- **No premature abstraction.** Introduce new patterns only when the concrete need is clear.
- **Root cause over workaround.** If a fix feels like a patch, say so and propose the clean alternative.

## Rules

### Language
All code, comments, variable names, type names, and commit messages must be in English. No exceptions.

### Tests
Unit and integration tests are expected alongside implementation — not as an afterthought. Run `pnpm test` before each commit. Vitest + RTL is the stack.

### Pre-commit hooks
Husky runs lint-staged on every commit. Never bypass with `--no-verify`.

### No automatic commits
Do not create git commits without explicit user approval. Present the diff and wait for the green light.

### Plan before non-trivial work
For tasks spanning 3+ steps or that involve architectural decisions, present a plan and get approval before writing code.

### Verify before declaring done
Never claim a task is complete without evidence. Run `pnpm lint`, `pnpm test`, and verify manually. Cite the output.

### Present tradeoffs for meaningful choices
Library selection, architectural patterns, data modeling — always present at least two options with pros/cons before proceeding.

### Respect the stage plan
Follow [docs/stages/overview.md](docs/stages/overview.md). Implement the current stage only. Do not implement future stages' features unless explicitly asked. A stage is complete only when all manual tests pass and `pnpm lint && pnpm test` exits 0.

### Verify syntax against official docs
Before writing implementation code that uses a library from the stack (Drizzle, Better Auth, OpenRouter, Tavily, Vitest, shadcn/ui, etc.), use Context7 to confirm the current API and configuration syntax. Training data may be outdated. Do not rely on memory for library-specific patterns.
