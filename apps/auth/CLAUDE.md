# apps/auth — Claude Code Guide

> This file adds scope-specific context for `apps/auth`. The root `CLAUDE.md` at the repo root contains global rules (language, tests, commits, stages) that apply here too.

## What This App Does

Better Auth server — JWT signing, session management, OAuth providers. At the current stage (**pre-v0.5**) this app is a minimal skeleton: it only exposes a `/health` endpoint. Full auth implementation is scoped to **v0.5**.

- **Port:** 3001

## v0.5 Is The Auth Stage

Do not implement auth routes, OAuth config, session handling, or middleware here unless you are actively working on v0.5. The skeleton exists to reserve the port and confirm the app boots cleanly. Only touch this app if the task is explicitly v0.5.

## Shared JWT Secret

`JWT_SECRET` is an environment variable shared between `apps/api` and `apps/auth`. Both apps must use the same value. `apps/api` validates JWTs locally — it makes no runtime HTTP call to `apps/auth` per request.
