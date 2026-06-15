# apps/web/Dockerfile
FROM node:20-alpine AS builder
ARG VITE_API_URL=http://localhost:3000
ARG VITE_AUTH_URL=http://localhost:3001
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AUTH_URL=$VITE_AUTH_URL
RUN pnpm --filter @prism/db build && pnpm --filter @prism/ui build && pnpm --filter @prism/web build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
