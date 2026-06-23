# apps/api/Dockerfile
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @prism/db build && pnpm --filter @prism/api exec tsc -p tsconfig.build.json

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
