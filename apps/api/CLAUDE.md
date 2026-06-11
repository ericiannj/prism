# apps/api — Claude Code Guide

> This file adds scope-specific context for `apps/api`. The root `CLAUDE.md` at the repo root contains global rules (language, tests, commits, stages) that apply here too.

## What This App Does

AI/RAG orchestration server. Handles document ingestion (parse → chunk → embed → store in pgvector), vector similarity search against `document_chunks`, LLM chat with tool calling via OpenRouter, and web search via Tavily. Every assistant response records its source (`parametric`, `rag`, or `web`).

- **Port:** 3000
- **Entry point:** `src/index.ts` → `src/app.ts`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `OPENROUTER_API_KEY` | Yes | LLM + embeddings via OpenRouter |
| `TAVILY_API_KEY` | Yes | Web search tool |
| `DEV_USER_ID` | Yes (pre-auth) | Fixed userId used in all requests; replaced by JWT auth in v0.5 |

## Internal Structure

```
src/
  routes/       # HTTP layer only — parse input, call service, return response
  services/     # Business logic (chat orchestration, document ingestion pipeline)
  lib/          # Low-level utilities (chunker, embedder, parser, tool definitions)
  swagger.ts    # OpenAPI spec generation (swagger-jsdoc config)
  app.ts        # Express app factory, middleware, route + swagger mounting
  index.ts      # Server entry point
```

**Strict layer rule:** routes call services, services call lib. No business logic in routes, no DB calls in lib.

## Key Patterns

### Pre-Auth userId (v0.2–v0.4)

All routes derive `userId` from `process.env.DEV_USER_ID ?? "dev-user-1"`. This is intentional — JWT auth arrives in v0.5. Do not add authentication middleware before that stage.

### SSE Streaming (Chat)

`POST /chat` responds with `text/event-stream`. The pattern:

1. Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
2. Call `res.flushHeaders()` immediately
3. Write events: `res.write(\`data: ${JSON.stringify(event)}\n\n\`)`
4. Event types:
   - `{ type: "token", content: string }` — LLM text fragment
   - `{ type: "done", sessionId: string, source: "parametric"|"rag"|"web", toolCalls: string[] }` — end of stream
   - `{ type: "error", error: string }` — on catch
5. Always call `res.end()` in the `finally` block

Never return a plain JSON response from the chat route.

### userId Filter on document_chunks

Every query that touches `document_chunks` must filter by `userId` first. Cross-user data leakage is a hard safety constraint — enforce it at the query level, not in application logic above it.

### Source Telemetry

`messages.source` is set based on which tools the LLM actually invoked:
- No tool calls → `"parametric"`
- `search_documents` called → `"rag"`
- `search_web` called → `"web"`

Never infer source after the fact or guess from response content.
