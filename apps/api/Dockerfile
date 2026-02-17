# ── Stage 1: Builder ──────────────────────────────────────────
FROM python:3.13-slim AS builder

WORKDIR /build

COPY apps/api/requirements.txt .

RUN pip install --no-cache-dir --prefix=/install \
    torch==2.10.0+cpu --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir --prefix=/install \
    -r requirements.txt

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM python:3.13-slim AS runtime

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code and model artifacts
COPY apps/api/app/ ./app/
COPY apps/api/artifacts/ ./artifacts/

# Non-root user for security
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-8000}/api/v1/health')"

# Railway injects $PORT at runtime; default to 8000 for local dev
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
