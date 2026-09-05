"""Limite ligero por usuario para operaciones costosas."""
from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException

_events: dict[str, deque[float]] = defaultdict(deque)
_lock = Lock()


def enforce_rate_limit(user_id: str, operation: str, limit: int, window_seconds: int = 60) -> None:
    """Impide rafagas accidentales. Puede sustituirse por Redis en multi-instancia."""
    key = f"{user_id}:{operation}"
    now = monotonic()
    with _lock:
        bucket = _events[key]
        while bucket and bucket[0] <= now - window_seconds:
            bucket.popleft()
        if len(bucket) >= limit:
            raise HTTPException(
                status_code=429,
                detail=f"Alcanzaste el limite temporal de {operation}. Espera un momento e intenta de nuevo.",
            )
        bucket.append(now)
