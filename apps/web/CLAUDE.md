# apps/web — Claude Code Guide

> This file adds scope-specific context for `apps/web`. The root `CLAUDE.md` at the repo root contains global rules (language, tests, commits, stages) that apply here too.

## What This App Does

React + Vite + Tailwind + shadcn user-facing frontend. Three pages: home, documents (upload + list), and chat (SSE-powered conversation with source badges per message).

- **Port:** 5173
- **Backend:** `apps/api` at `http://localhost:3000`

## File Structure

```
src/
  pages/          # Full-page route components (HomePage, DocumentsPage, ChatPage)
  components/     # Reusable UI components (Nav, UploadForm, DocumentList, MessageBubble)
  lib/            # Utility functions
  main.tsx        # React entry point with BrowserRouter
  App.tsx         # Route definitions
```

## Key Conventions

### No Direct DB Access

All data fetching goes through `apps/api`. Never import from `@prism/db` in this app.

### shadcn Components Live in packages/ui

shadcn components (Button, Card, Input, etc.) are installed and maintained in `packages/ui`. Import from there:

```ts
import { Button } from "@prism/ui/components/ui/button";
```

Never run `npx shadcn add` inside `apps/web`. Add new shadcn components in `packages/ui`.

### Icons

Use `lucide-react` exclusively. It ships with shadcn and is already installed.

### Styling

Tailwind CSS utility classes only. No inline `style` props, no CSS modules, no additional `.css` files beyond `src/index.css` (global resets only).

### API Calls

Use `fetch` directly. No HTTP client library (axios, ky, etc.). Base URL: `http://localhost:3000`.
