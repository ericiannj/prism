#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# Prism — production deploy script
#
# What it does:
#   1. Builds the frontend with production env vars
#   2. Syncs the build to S3 (assets: immutable cache, index.html: no-cache)
#   3. Invalidates the CloudFront distribution so users get the new version
#   4. Rsyncs source code to EC2
#   5. Rebuilds Docker images on EC2 and restarts the containers
# ---------------------------------------------------------------------------

DEPLOY_ENV="$(dirname "$0")/.env.deploy"
if [[ ! -f "$DEPLOY_ENV" ]]; then
  echo "Error: $DEPLOY_ENV not found. Copy .env.deploy.example and fill in the values." >&2
  exit 1
fi
# shellcheck source=.env.deploy.example
source "$DEPLOY_ENV"

# ---------------------------------------------------------------------------
echo "==> [1/5] Building frontend..."
VITE_API_URL=https://api.prism.ericjunqueira.com \
VITE_AUTH_URL=https://auth.prism.ericjunqueira.com \
VITE_WEB_URL=https://prism.ericjunqueira.com \
  pnpm turbo build --filter=@prism/web --force

# ---------------------------------------------------------------------------
echo "==> [2/5] Uploading to S3..."
aws s3 sync apps/web/dist/ "s3://$S3_BUCKET/" \
  --delete \
  --profile "$AWS_PROFILE" \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html"

aws s3 cp apps/web/dist/index.html "s3://$S3_BUCKET/index.html" \
  --cache-control "no-cache,no-store,must-revalidate" \
  --profile "$AWS_PROFILE"

# ---------------------------------------------------------------------------
echo "==> [3/5] Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths "/*" \
  --profile "$AWS_PROFILE" \
  --query "Invalidation.Status" \
  --output text

# ---------------------------------------------------------------------------
echo "==> [4/5] Syncing source to EC2..."
rsync -az --delete \
  -e "ssh -i $EC2_KEY -o StrictHostKeyChecking=no" \
  --exclude=".git" \
  --exclude="node_modules" \
  --exclude="apps/web/dist" \
  --exclude="**/dist" \
  --exclude="**/.turbo" \
  ./ "$EC2_HOST:$EC2_DIR/"

# ---------------------------------------------------------------------------
echo "==> [5/5] Rebuilding images and restarting containers on EC2..."
ssh -i "$EC2_KEY" -o StrictHostKeyChecking=no "$EC2_HOST" bash << 'REMOTE'
  set -euo pipefail
  cd /home/ubuntu/prism

  echo "  -> Building prism-api..."
  docker build -f apps/api/Dockerfile -t prism-api:latest .

  echo "  -> Building prism-auth..."
  docker build -f apps/auth/Dockerfile -t prism-auth:latest .

  echo "  -> Restarting containers..."
  docker stop prism-api-1 prism-auth-1 2>/dev/null || true
  docker rm   prism-api-1 prism-auth-1 2>/dev/null || true

  docker run -d --name prism-api-1  --env-file .env.prod -p 3000:3000 --restart always prism-api:latest
  docker run -d --name prism-auth-1 --env-file .env.prod -p 3001:3001 --restart always prism-auth:latest

  docker ps --format 'table {{.Names}}\t{{.Status}}'

  echo "  -> Pruning old images..."
  docker image prune -f
REMOTE

echo ""
echo "Deploy complete."
echo "  Frontend: https://prism.ericjunqueira.com"
echo "  API:      https://api.prism.ericjunqueira.com/health"
echo "  Auth:     https://auth.prism.ericjunqueira.com/health"
