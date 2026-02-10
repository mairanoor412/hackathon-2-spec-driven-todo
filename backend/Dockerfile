# Generated from @specs/k8s-infrastructure/Dockerization.md
# Multi-stage Dockerfile for FastAPI backend

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

# Install libpq for psycopg2 runtime (no gcc/build tools)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

# Copy installed packages from dependencies stage
COPY --from=dependencies /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Copy application source
COPY . .

# Remove files not needed at runtime
RUN rm -rf __pycache__ .env .env.example tests/ *.md .dockerignore Dockerfile

# Switch to non-root user
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Use shell form so $PORT env var expands (Railway sets PORT dynamically)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
