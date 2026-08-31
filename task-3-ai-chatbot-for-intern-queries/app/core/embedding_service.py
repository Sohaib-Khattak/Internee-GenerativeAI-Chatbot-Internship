"""Embedding service — generates embeddings for semantic search."""
import numpy as np


class EmbeddingService:
    """Simple embedding service using character-level hashing as a lightweight approach.

    For production, replace with sentence-transformers multilingual model.
    """

    def embed(self, text: str, prefix: str = "query: ") -> list[float]:
        """Generate a simple hash-based embedding vector (384 dimensions).

        This is a lightweight placeholder. For production, use a model like
        multilingual-e5-small for proper semantic embeddings.
        """
        import hashlib

        text = prefix + text
        # Deterministic hash-based embedding
        dims = 384
        vector = []
        for i in range(dims):
            h = hashlib.md5(f"{text}:{i}".encode()).hexdigest()
            val = int(h[:8], 16) / 0xFFFFFFFF
            vector.append(val)

        # Normalize
        arr = np.array(vector, dtype=np.float32)
        norm = np.linalg.norm(arr)
        if norm > 0:
            arr = arr / norm
        return arr.tolist()
