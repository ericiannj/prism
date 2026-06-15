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

Copy `.env.example` to `.env` at the root.

```
# Database
DATABASE_URL=postgresql://prism:prism@localhost:5432/prism

# LLM + embeddings (v0.2+)
OPENROUTER_API_KEY=

# Web search (v0.4+)
TAVILY_API_KEY=

# Auth — must be identical in apps/api and apps/auth (v0.5+)
JWT_SECRET=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3001
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

> Register at http://localhost:5173/register to create an account before using the app.

## Production

```bash
# 1. Copy and fill in production env
cp .env.prod.example .env.prod

# 2. Build and start all services
docker compose -f docker-compose.prod.yml up -d --build
```

The web app will be available at http://localhost (port 80).

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full schema, service communication diagram, and AI agent loop.
