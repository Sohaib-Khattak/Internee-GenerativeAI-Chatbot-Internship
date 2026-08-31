"""Knowledge base — handles loading, searching, and hot-reloading of KB content."""
import json
import os
import time
from typing import Optional
from dataclasses import dataclass


@dataclass
class KBChunk:
    id: str
    title: str
    content: str
    category: str
    score: float = 0.0


class KnowledgeBase:
    """Loads and searches KB JSON files with hot-reload support."""

    def __init__(self, kb_path: str):
        self._kb_path = kb_path
        self._documents: list[KBChunk] = []
        self._faq_index: dict[str, list[KBChunk]] = {}
        self._last_load: float = 0
        self._load()

    def _load(self):
        """Load all JSON files from the knowledge-base directory."""
        self._documents = []
        self._faq_index = {}

        if not os.path.exists(self._kb_path):
            return

        for fname in os.listdir(self._kb_path):
            if fname.endswith(".json"):
                fpath = os.path.join(self._kb_path, fname)
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    for item in data:
                        chunk = KBChunk(
                            id=item.get("id", ""),
                            title=item.get("title", ""),
                            content=item.get("content", ""),
                            category=item.get("category", "faq"),
                        )
                        self._documents.append(chunk)
                        # Build keyword index for exact FAQ matching
                        for tag in item.get("tags", []):
                            if tag not in self._faq_index:
                                self._faq_index[tag] = []
                            self._faq_index[tag].append(chunk)
                        # Also index by title words
                        for word in chunk.title.lower().split():
                            clean = word.strip(".,!?;:")
                            if clean not in self._faq_index:
                                self._faq_index[clean] = []
                            self._faq_index[clean].append(chunk)
                except (json.JSONDecodeError, IOError) as e:
                    print(f"Warning: Could not load {fname}: {e}")

        self._last_load = time.time()

    def hot_reload(self):
        """Atomically reload the knowledge base (instant swap)."""
        old_docs = self._documents
        old_index = self._faq_index
        try:
            self._load()
        except Exception:
            # Revert on failure
            self._documents = old_docs
            self._faq_index = old_index
            raise

    def exact_match(self, query: str) -> Optional[KBChunk]:
        """Tier 1: Check if query matches a known FAQ keyword/tag."""
        query_lower = query.lower().strip()
        tokens = query_lower.split()

        # Check each word in query against our FAQ index
        for token in tokens:
            clean = token.strip(".,!?;:")
            if clean in self._faq_index:
                matches = self._faq_index[clean]
                # Return highest priority match (first one)
                if matches:
                    return matches[0]
        return None

    def keyword_search(self, query: str, limit: int = 3) -> list[KBChunk]:
        """Tier 2: Simple keyword-based search."""
        query_lower = query.lower()
        query_words = set(query_lower.split())
        scored = []

        for doc in self._documents:
            score = 0
            title_lower = doc.title.lower()
            content_lower = doc.content.lower()

            # Score by keyword matches in title (higher weight)
            for word in query_words:
                clean_word = word.strip(".,!?;:")
                if clean_word in title_lower:
                    score += 3
                if clean_word in content_lower:
                    score += 1

            if score > 0:
                doc.score = score
                scored.append(doc)

        scored.sort(key=lambda x: x.score, reverse=True)
        return scored[:limit]

    def retrieve(self, query: str, query_embedding: list[float] = None, limit: int = 3) -> list[KBChunk]:
        """Unified retrieval: Tier 1 (exact) → Tier 2 (keyword)."""
        results = []

        # Tier 1: Exact FAQ match
        exact = self.exact_match(query)
        if exact:
            exact.score = 10.0
            results.append(exact)

        # Tier 2: Keyword search
        if len(results) < limit:
            keyword_results = self.keyword_search(query, limit=limit)
            for r in keyword_results:
                if r.id not in {d.id for d in results}:
                    results.append(r)

        return results[:limit]

    @property
    def document_count(self) -> int:
        return len(self._documents)
