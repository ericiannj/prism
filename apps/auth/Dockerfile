# apps/auth/Dockerfile
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @prism/db build && pnpm --filter @prism/auth build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3001
CMD ["node", "apps/auth/dist/index.js"]
