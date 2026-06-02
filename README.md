# Prism

Full-stack RAG platform where users upload documents, embed them into a personal vector store, and query a chat interface that retrieves from three sources: model training, user documents (pgvector), and the web (Tavily). Every assistant message shows which source was used.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd prism
pnpm install

# 2. Copy env file
cp .env.example .env

# 3. Start the database
docker compose up -d

# 4. Start all apps
pnpm dev
```

Open http://localhost:5173

## Dev Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in parallel (Turborepo) |
| `pnpm test` | Run all Vitest suites |
| `pnpm lint` | ESLint + Prettier across all packages |
| `pnpm build` | Build all apps |
| `docker compose up -d` | Start PostgreSQL + pgvector |
| `docker compose down` | Stop the database |

## Environment Variables

Copy `.env.example` to `.env` at the root. Variables added per stage:

```
# v0.1 — available now
DATABASE_URL=postgresql://prism:prism@localhost:5432/prism
DEV_USER_ID=dev-user-1

# v0.2+ — needed for document ingestion and chat
OPENROUTER_API_KEY=

# v0.4+ — needed for web search
TAVILY_API_KEY=

# v0.5+ — needed for auth
JWT_SECRET=
BETTER_AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

> `JWT_SECRET` must be the same value in `apps/api` and `apps/auth` when auth is wired (v0.5).

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full schema, service communication diagram, and AI agent loop.
