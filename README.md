<p align="center">
  <img src="apps/web/public/favicon.svg" width="72" alt="Prism" />
</p>

<h1 align="center">Prism</h1>

<p align="center">
  Full-stack RAG platform where every answer shows exactly where it came from.
</p>

## Why

Most AI chat tools are a black box — you never know if the answer came from the model's training, something you uploaded, or the web. Prism makes the source of every response explicit, so you can trust the answer and trace it back.

## Features

- **Document Upload & Embedding** — Upload PDFs and text files; they're chunked, embedded, and stored in your personal vector store (pgvector). Your documents become a private, queryable knowledge base.
- **Hybrid RAG** — Every query draws from three sources in parallel: model training, your documents (pgvector semantic search), and live web results (Tavily).
- **Source Attribution** — Every assistant message shows which source answered: model, documents, or web. No guessing.
- **Auth** — Google OAuth and email/password via Better Auth. Each user's document store is fully isolated.
- **Full-Stack Monorepo** — React (Vite) frontend, Express API, PostgreSQL + pgvector, all orchestrated with Turborepo and pnpm workspaces.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker

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

> Register at http://localhost:5173/register to create an account before using the app.

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

## Production

```bash
# 1. Copy and fill in production env
cp .env.prod.example .env.prod

# 2. Build and start all services
docker compose -f docker-compose.prod.yml up -d --build
```

The web app will be available at port 80. On a local machine: http://localhost — on a remote server, replace with the server's IP or domain.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full schema, service communication diagram, and AI agent loop.
