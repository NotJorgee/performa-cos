#!/bin/sh
set -e

echo "[startup] Applying pending database migrations via Alembic..."
alembic upgrade head

echo "[startup] Starting Uvicorn ASGI server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --workers 1
