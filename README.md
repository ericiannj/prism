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

# 2. Copy env files and fill in your keys
cp apps/api/.env.example apps/api/.env
cp apps/auth/.env.example apps/auth/.env

# 3. Start the database
docker compose up -d

# 4. Run migrations
pnpm --filter @repo/db migrate

# 5. Start all apps
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

### apps/api/.env

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rag
OPENROUTER_API_KEY=
TAVILY_API_KEY=
JWT_SECRET=
DEV_USER_ID=dev-user-1     # used in v0.2–v0.4 before auth is wired
```

### apps/auth/.env

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rag
JWT_SECRET=                 # must match apps/api
BETTER_AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

> `JWT_SECRET` must be the same value in both files.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full schema, service communication diagram, and AI agent loop.
