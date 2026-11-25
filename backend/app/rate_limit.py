"""
rate_limit.py — Lightweight sliding-window in-memory rate limiter for PerformaCOS.
"""
import time
from collections import defaultdict
from threading import Lock
from typing import Dict, List, Optional

from fastapi import HTTPException, Request, status

_BUCKETS: Dict[str, Dict[str, List[float]]] = defaultdict(dict)
_LOCK = Lock()
_PRUNE_THRESHOLD = 2000


def get_client_ip(request: Optional[Request]) -> str:
    """Resolve real client IP, honoring reverse-proxy X-Forwarded-For headers."""
    if not request:
        return "unknown"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def enforce_rate_limit(
    bucket: str,
    key: str,
    max_requests: int,
    window_seconds: float,
    detail: str = "Too many requests. Please wait a moment and try again.",
) -> None:
    """Enforce a per-bucket, per-key sliding-window rate limit."""
    now = time.time()
    cutoff = now - window_seconds

    with _LOCK:
        store = _BUCKETS[bucket]
        if len(store) > _PRUNE_THRESHOLD:
            stale_keys = [k for k, ts_list in store.items() if not ts_list or ts_list[-1] <= cutoff]
            for stale_key in stale_keys:
                del store[stale_key]

        attempts = [t for t in store.get(key, []) if t > cutoff]
        if len(attempts) >= max_requests:
            store[key] = attempts
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=detail,
            )
        attempts.append(now)
        store[key] = attempts
