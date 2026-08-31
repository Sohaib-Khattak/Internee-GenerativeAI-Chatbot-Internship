"""In-memory sliding window rate limiter."""
import time
from collections import defaultdict
from functools import wraps
from flask import request, jsonify, current_app


class InMemoryRateLimiter:
    """Simple in-memory sliding window counter."""

    def __init__(self):
        self._buckets: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str, max_requests: int = 30, window_seconds: int = 60) -> bool:
        """Return True if request is allowed."""
        now = time.time()
        cutoff = now - window_seconds
        bucket = self._buckets[key]
        # Prune old entries
        self._buckets[key] = [t for t in bucket if t > cutoff]
        if len(self._buckets[key]) >= max_requests:
            return False
        self._buckets[key].append(now)
        return True


limiter = InMemoryRateLimiter()


def rate_limit(limit: int = 30, per: int = 60):
    """Decorator: apply rate limit to a Flask route."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            key = f"rl:{request.remote_addr}:{request.path}"
            if not limiter.check(key, limit, per):
                return jsonify({
                    "error": "rate_limit_exceeded",
                    "message": f"Too many requests. Please wait and try again.",
                    "retry_after": per,
                }), 429
            return f(*args, **kwargs)
        return wrapper
    return decorator
