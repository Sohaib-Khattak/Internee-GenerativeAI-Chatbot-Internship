"""Semantic cache — reduces LLM calls by caching responses to similar queries."""
import hashlib
import time
import json
import numpy as np
from typing import Optional
from app.core.embedding_service import EmbeddingService


class SemanticCache:
    """Cache that matches queries by embedding similarity."""

    def __init__(self, similarity_threshold: float = 0.92, ttl_seconds: int = 86400):
        self._threshold = similarity_threshold
        self._ttl = ttl_seconds
        self._embedder = EmbeddingService()
        self._cache: dict[str, dict] = {}  # key -> {embedding, response, timestamp, hits}

    def _make_key(self, query: str) -> str:
        return hashlib.md5(query.lower().strip().encode()).hexdigest()

    def get(self, query: str) -> Optional[str]:
        """Check cache — returns cached response if a similar query exists."""
        query_embedding = np.array(self._embedder.embed(query, prefix="query: "))
        now = time.time()
        best_score = 0.0
        best_entry = None

        # Check all cached entries for similarity
        for key, entry in list(self._cache.items()):
            # Expire old entries
            if now - entry["timestamp"] > self._ttl:
                del self._cache[key]
                continue

            cached_emb = np.array(entry["embedding"])
            score = np.dot(query_embedding, cached_emb) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(cached_emb)
            )
            if score > best_score:
                best_score = score
                best_entry = entry

        if best_score >= self._threshold and best_entry:
            best_entry["hits"] += 1
            return best_entry["response"]
        return None

    def set(self, query: str, response: str):
        """Store a query-response pair in cache."""
        key = self._make_key(query)
        embedding = self._embedder.embed(query, prefix="query: ")
        self._cache[key] = {
            "embedding": embedding,
            "response": response,
            "timestamp": time.time(),
            "hits": 1,
        }

    def stats(self) -> dict:
        """Return cache statistics."""
        total = len(self._cache)
        hits = sum(e["hits"] for e in self._cache.values())
        return {
            "size": total,
            "total_hits": hits,
            "ttl_seconds": self._ttl,
            "threshold": self._threshold,
        }
