"""RAG pipeline: retrieve → augment → generate."""
from typing import Optional
from flask import current_app

from app.core.llm_client import OpenCodeLLM, RateLimitError
from app.core.knowledge_base import KnowledgeBase, KBChunk
from app.core.session_manager import SessionManager, Message as SessionMessage
from app.core.semantic_cache import SemanticCache
from app.utils.language_utils import preprocess_query, LanguageDetector


# Greeting keywords for simple keyword matching (no LLM call needed)
GREETINGS = {
    "hi", "hello", "hey", "salam", "assalamualaikum", "assalam-o-alaikum",
    "kya haal hai", "kese ho", "how are you", "good morning", "good evening",
    "bye", "goodbye", "khuda hafiz", "allah hafiz",
}

# System prompt for the chatbot
SYSTEM_PROMPT = """You are an AI assistant for Internee.pk, a platform connecting Pakistani students with internship opportunities.

Rules:
1. Answer ONLY based on the provided context. If the context does not contain the answer, say "Main is baare mein nahi janta. Please Internee.pk support se contact karein at support@internee.pk." / "I don't have information about that. Please contact Internee.pk support."
2. You may use Urdu, English, or Roman Urdu (code-switching) as appropriate to match the user's language.
3. Keep responses concise (under 200 words) unless more detail is needed.
4. Always be polite, professional, and encouraging to interns.
5. If the user asks about something outside the context, gently redirect to supported topics (tasks, policies, FAQs).

Context information:
{context}

Conversation history:
{history}
"""


class KeywordMatcher:
    """Simple keyword-based intent matcher for greetings and common phrases."""

    def match(self, query: str) -> Optional[str]:
        """Returns an intent name if matched, or None."""
        q = query.lower().strip()

        # Check for greeting
        if q in GREETINGS or q.rstrip("!.,?") in GREETINGS:
            return "greeting"

        return None


class RAGEngine:
    """Main RAG pipeline."""

    def __init__(
        self,
        llm_client: OpenCodeLLM,
        knowledge_base: KnowledgeBase,
        session_manager: SessionManager,
    ):
        self.llm = llm_client
        self.kb = knowledge_base
        self.sm = session_manager
        self.matcher = KeywordMatcher()
        self.lang = LanguageDetector()
        self.cache = SemanticCache()

    def process_query(
        self,
        platform: str,
        platform_user_id: str,
        query: str,
    ) -> dict:
        """Process a user query through the full pipeline.

        Returns:
            dict with keys: reply, session_id, intent, confidence, sources, tokens_used
        """
        # Preprocess
        normalized = preprocess_query(query)
        detected_lang = self.lang.detect(query).value

        # Get or create session
        session = self.sm.get_or_create(platform, platform_user_id)

        # Check greeting keywords first (no LLM call)
        intent = self.matcher.match(query)
        if intent == "greeting":
            reply = "Hello! 👋 Main Internee.pk ka AI assistant hoon. Main aapki tasks, policies, aur FAQs mein madad kar sakta hoon. Kya poochhna chahenge?" if detected_lang != "en" else "Hello! 👋 I'm the Internee.pk AI assistant. I can help you with tasks, policies, and FAQs. What would you like to know?"
            self.sm.add_message(session.id, "user", query)
            self.sm.add_message(session.id, "assistant", reply)
            return {
                "reply": reply,
                "session_id": session.id,
                "intent": "greeting",
                "confidence": 0.95,
                "sources": [],
                "tokens_used": 0,
            }

        # RAG path: retrieve KB context
        chunks = self.kb.retrieve(query, limit=3)
        context_text = "\n\n".join(
            f"[{c.category.upper()}] {c.title}\n{c.content[:1500]}"
            for c in chunks
        ) if chunks else ""

        # Format conversation history (last 6 messages)
        history_messages = session.messages[-6:]
        history_text = "\n".join(
            f"{m.role}: {m.content[-500:]}" for m in history_messages
        )

        # Build prompt
        system = SYSTEM_PROMPT.format(
            context=context_text or "(No relevant information found in the knowledge base.)",
            history=history_text or "(No previous conversation.)",
        )

        messages = [
            {"role": "system", "content": system},
        ]
        # Add conversation history
        for m in history_messages:
            messages.append({"role": m.role, "content": m.content[-1000:]})
        # Add current query
        messages.append({"role": "user", "content": query})

        try:
            # Check semantic cache first
            cached_reply = self.cache.get(query)
            if cached_reply:
                reply = cached_reply
                tokens_used = 0
                latency = 0
            else:
                # Call LLM
                response = self.llm.chat_completion(messages=messages, temperature=0.3)
                reply = response.content
                tokens_used = response.tokens_used
                latency = response.latency_ms
                # Store in cache
                self.cache.set(query, reply)
        except RateLimitError:
            reply = "I'm currently busy with many requests. Please try again in a few minutes."
            tokens_used = 0
            latency = 0
        except Exception as e:
            current_app.logger.error(f"RAG error: {e}")
            reply = "Sorry, I couldn't process that. Please try again later."
            tokens_used = 0
            latency = 0

        # Save to session
        self.sm.add_message(session.id, "user", query)
        self.sm.add_message(session.id, "assistant", reply)

        return {
            "reply": reply,
            "session_id": session.id,
            "intent": "rag_response",
            "confidence": 0.6 if chunks else 0.0,
            "sources": [{"id": c.id, "title": c.title, "score": c.score} for c in chunks],
            "tokens_used": tokens_used,
        }
