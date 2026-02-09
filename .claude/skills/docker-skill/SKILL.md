---
name: docker-skill
description: Build, run, and manage Docker containers for the Todo AI Chatbot. Generates multi-stage Dockerfiles for FastAPI backend and Next.js frontend, docker-compose orchestration, .dockerignore files, and provides build/run/debug commands. Use this skill for any Docker containerization task in Phase 4.
version: 1.0.0
author: Spec-Driven Development
tags:
  - docker
  - dockerfile
  - multi-stage-build
  - docker-compose
  - containerization
  - fastapi
  - nextjs
  - phase4
  - kubernetes
---

# Docker Skill

Build, run, and manage Docker containers for the Todo AI Chatbot Phase 4 deployment.

## When to Use This Skill

Use this skill when you need to:

- Create or modify Dockerfiles for backend (FastAPI) or frontend (Next.js)
- Write or update docker-compose.yml for local multi-service testing
- Create or update .dockerignore files
- Build, tag, or run container images
- Debug container build failures or runtime issues
- Optimize Docker layer caching or image sizes
- Add `output: "standalone"` to next.config.ts for containerized Next.js
- Verify containers pass health checks and serve traffic correctly

## Prerequisites

- Docker Engine or Docker Desktop installed (`docker --version`)
- Docker Compose V2 available (`docker compose version`)
- Project source code at repository root with `backend/` and `frontend/` directories
- Environment variables documented in `backend/.env.example` and `frontend/.env.example`

## Reference Specs

- `@specs/k8s-infrastructure/Dockerization.md` - Full containerization specification
- `@specs/features/local-kubernetes-deployment/spec.md` - Parent feature spec
- `@specs/features/local-kubernetes-deployment/tasks.md` - Tasks T041-T043

## Environment Variable Contract

### Backend Container (port 8000)
```
DATABASE_URL          - Neon PostgreSQL connection string
BETTER_AUTH_SECRET    - Shared JWT secret (match frontend)
BETTER_AUTH_URL       - Frontend URL for JWKS (http://frontend:3000 in Docker network)
CORS_ORIGINS          - Allowed CORS origins (http://localhost:3000)
GEMINI_API_KEY        - Google Gemini API key for AI chatbot
```

### Frontend Container (port 3000)
```
DATABASE_URL                - Neon PostgreSQL connection string
BETTER_AUTH_SECRET          - Shared JWT secret (match backend)
BETTER_AUTH_URL             - Self URL for auth callbacks (http://localhost:3000)
NEXT_PUBLIC_BETTER_AUTH_URL - Public auth URL (http://localhost:3000)
NEXT_PUBLIC_API_URL         - Backend API URL (http://localhost:8000)
```

## Step-by-Step Process

### Step 1: Create Backend Dockerfile

Create `backend/Dockerfile` with multi-stage build:

```dockerfile
# backend/Dockerfile
# Stage 1: Dependencies
FROM python:3.13-slim AS dependencies

WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.13-slim AS runtime

WORKDIR /app

# Install libpq for psycopg2 runtime (no gcc needed)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

# Copy installed packages from dependencies stage
COPY --from=dependencies /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Copy application source
COPY . .

# Remove files not needed at runtime
RUN rm -rf __pycache__ .env .env.example tests/ *.md

# Switch to non-root user
USER appuser

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Start uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 2: Create Backend .dockerignore

Create `backend/.dockerignore`:

```
__pycache__
*.pyc
*.pyo
.env
.env.*
!.env.example
.git
.gitignore
venv/
.venv/
*.md
tests/
.pytest_cache/
.mypy_cache/
.ruff_cache/
Dockerfile
.dockerignore
```

### Step 3: Create Frontend Dockerfile

Create `frontend/Dockerfile` with multi-stage build using standalone output:

```dockerfile
# frontend/Dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Stage 2: Build
FROM node:22-alpine AS build

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Set build-time env vars (non-sensitive defaults for build)
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BETTER_AUTH_URL=$NEXT_PUBLIC_BETTER_AUTH_URL

# Build Next.js in standalone mode
RUN npm run build

# Stage 3: Runtime
FROM node:22-alpine AS runtime

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy standalone build output
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# Switch to non-root user
USER appuser

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start Next.js standalone server
CMD ["node", "server.js"]
```

### Step 4: Create Frontend .dockerignore

Create `frontend/.dockerignore`:

```
node_modules
.next
.env
.env.*
!.env.example
.git
.gitignore
*.md
Dockerfile
.dockerignore
.turbo
coverage/
.vercel
```

### Step 5: Modify next.config.ts for Standalone Output

Update `frontend/next.config.ts` to enable standalone output:

```typescript
// frontend/next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Server actions are stable in Next.js 15+
  },
}

export default nextConfig
```

### Step 6: Create Docker Compose

Create `docker-compose.yml` at repository root:

```yaml
# docker-compose.yml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    environment:
      - CORS_ORIGINS=http://localhost:3000
      - BETTER_AUTH_URL=http://frontend:3000
    networks:
      - todo-network
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: http://localhost:8000
        NEXT_PUBLIC_BETTER_AUTH_URL: http://localhost:3000
    ports:
      - "3000:3000"
    env_file:
      - ./frontend/.env
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - todo-network

networks:
  todo-network:
    driver: bridge
```

## Common Commands

### Build Images
```bash
# Build backend image
docker build -t todo-backend:latest ./backend

# Build frontend image
docker build -t todo-frontend:latest ./frontend

# Build both with docker-compose
docker compose build
```

### Run Containers
```bash
# Run backend standalone (with env vars)
docker run -d --name todo-backend \
  --env-file ./backend/.env \
  -p 8000:8000 \
  todo-backend:latest

# Run frontend standalone
docker run -d --name todo-frontend \
  --env-file ./frontend/.env \
  -p 3000:3000 \
  todo-frontend:latest

# Run both with docker-compose
docker compose up -d

# Run with logs visible
docker compose up
```

### Verify
```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# Check container processes run as non-root
docker exec todo-backend whoami    # should print: appuser
docker exec todo-frontend whoami   # should print: appuser

# Check image sizes
docker images | grep todo
```

### Cleanup
```bash
# Stop and remove all containers + networks
docker compose down

# Remove images too
docker compose down --rmi local

# Remove everything including volumes
docker compose down --rmi local -v
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `psycopg2` build fails | Missing libpq-dev | Ensure `apt-get install libpq-dev gcc` in dependencies stage |
| Frontend build fails | Missing standalone output | Add `output: 'standalone'` to `next.config.ts` |
| Container starts but API unreachable | Wrong port binding | Check `-p 8000:8000` mapping |
| `ECONNREFUSED` between containers | Services on different networks | Use `docker compose` with shared network, use service names not localhost |
| `ImagePullBackOff` in k8s | Image not loaded to Minikube | Run `minikube image load todo-backend:latest` |
| Build cache not working | COPY order wrong | Copy dependency files first, then source code |
| Permission denied at runtime | Running as root | Ensure `USER appuser` in Dockerfile |

## Acceptance Criteria

- [ ] Backend image builds successfully under 5 minutes
- [ ] Frontend image builds successfully under 5 minutes
- [ ] Both images are under 500MB each
- [ ] Backend container responds to `/health` endpoint
- [ ] Frontend container serves the landing page
- [ ] Both containers run as non-root users
- [ ] `docker compose up` starts both services with networking
- [ ] Full app works end-to-end via docker-compose (auth, CRUD, chatbot)
- [ ] `docker compose down` cleanly removes all resources
- [ ] No secrets baked into images (all via env vars)
- [ ] .dockerignore excludes node_modules, venv, .env, .git

## Related Skills

- `minikube-skill` - Load built images into Minikube cluster
- `helm-skill` - Deploy containers via Helm charts
- `aiops-skill` - AI-assisted container debugging
