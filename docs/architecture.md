# Architecture Reference

## Service Communication

```
web  →  auth   login/register/OAuth → receives JWT
web  →  api    all requests carry JWT in Authorization header
api            validates JWT locally using shared JWT_SECRET (no call to auth per request)
api  →  OpenRouter   LLM calls (tool use + embeddings)
api  →  Tavily       when search_web tool is invoked
api  →  PostgreSQL   document chunks, chat sessions, messages
auth →  PostgreSQL   users, sessions (managed by Better Auth)
```

**Pre-auth development (v0.2–v0.4):** Before v0.5 is implemented, `apps/api` uses a hardcoded `DEV_USER_ID` env var as the `userId` for all requests. This allows the full RAG pipeline to be built and tested without auth scaffolding.

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Health check |
| POST | `/documents/ingest` | Upload + parse + embed a document |
| GET | `/documents` | List user's documents |
| DELETE | `/documents/:id` | Delete document + cascade chunks |
| POST | `/chat` | Send message, receive SSE stream |
| GET | `/chat/:id/messages` | Load message history for a session |

Auth routes are handled by Better Auth under `/auth/*` in `apps/auth`.

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/login` | Email/password login + Google OAuth |
| `/register` | New account creation |
| `/change-password` | Authenticated, change password |
| `/documents` | List ingested documents + upload new ones |
| `/chat` | Chat interface with per-message telemetry badges |

Telemetry badge colors: gray = parametric, green = embeddings, blue = web, purple = mixed.

## Database Schema

### Managed by apps/auth (Better Auth)

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

### Managed by packages/db (apps/api)

**documents**
| column | type | notes |
|--------|------|-------|
| id | uuid (PK) | |
| userId | text → users.id | owner |
| name | text | original filename |
| type | enum: pdf, txt, md | |
| sizeBytes | integer | |
| status | enum: processing, ready, error | |
| createdAt | timestamp | |

**document_chunks**
| column | type | notes |
|--------|------|-------|
| id | uuid (PK) | |
| documentId | uuid → documents.id | cascade delete |
| userId | text → users.id | denormalized for query isolation |
| content | text | chunk text |
| embedding | vector(1536) | text-embedding-3-small via OpenRouter |
| chunkIndex | integer | order within document |
| metadata | jsonb | page number, char offsets, etc. |

Indexes: `hnsw(embedding vector_cosine_ops)`, `(userId)`.

**Every query on document_chunks must filter by `userId` before computing similarity** — cross-user leakage is impossible at the query level.

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

## AI Agent Loop

The agent runs inside `apps/api`. Uses the OpenRouter API directly (no SDK abstraction).

```
1. api receives POST /chat { sessionId, message }
2. api builds messages array (history + new user message)
3. api sends to OpenRouter with two tools declared:
     - search_embeddings: { query: string, limit?: number }
     - search_web: { query: string }
4. LLM responds:
     a. tool_use block → api executes tool → result appended → back to step 3
     b. text block → final response, loop ends
5. api records which tools were called:
     - no tools called    → source = "parametric"
     - search_embeddings  → source = "embeddings"
     - search_web         → source = "web"
     - both               → source = "mixed"
6. message + source + toolCalls saved to DB
7. streaming response (SSE) sent to web
```

### Tool Implementations

**`search_embeddings(query, limit=5)`** — embeds `query` via OpenRouter, runs cosine similarity search on `document_chunks` filtered by `userId`, returns top-k chunk contents.

**`search_web(query)`** — calls Tavily Search API, returns top results with title, URL, and snippet.
