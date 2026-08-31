"""Google Gemini API client.

Replaces the previous OpenCode (OpenAI-compatible) client. Uses Google's
official `google-generativeai` SDK. Keeps the same interface as before
(LLMResponse, chat_completion, chat_completion_stream, RateLimitError,
LLMAPIError) so the RAG engine and platform integrations don't need changes.
"""
import time
import json
from typing import Optional
from dataclasses import dataclass

import google.generativeai as genai


@dataclass
class LLMResponse:
    content: str
    tokens_used: int
    model: str
    latency_ms: int


class GeminiLLM:
    """Wrapper around Google's Gemini generative API."""

    def __init__(self, api_key: str, model: str = None):
        self.api_key = api_key
        self.model = model or "gemini-3.6-flash"
        genai.configure(api_key=api_key)

    def _handle_exception(self, e: Exception):
        """Map SDK exceptions to our portable error types."""
        import google.api_core.exceptions as gax
        if isinstance(e, gax.ResourceExhausted):
            raise RateLimitError("Gemini API rate limit exceeded") from e
        if isinstance(e, (gax.GoogleAPICallError, gax.RetryError, gax.DeadlineExceeded)):
            raise LLMAPIError(f"Gemini API error: {e}") from e
        raise LLMAPIError(f"Gemini API request failed: {e}") from e

    def chat_completion(
        self,
        messages: list[dict],
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> LLMResponse:
        """Call the Gemini generate-content endpoint.

        Args:
            messages: List of {"role": "system"|"user"|"assistant", "content": str}
            temperature: Lower = more factual, higher = more creative
            max_tokens: Maximum response length

        Returns:
            LLMResponse with content, token usage, and latency.
        """
        # The SDK's chat model expects roles "user"/"model" (no system role),
        # and history dicts use a "parts" key, not "content".
        # Fold the system prompt in as the opening user turn so the model
        # still sees it, then convert turns to the SDK's format.
        system_prompt = ""
        turns = []
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role == "system":
                system_prompt = content
            else:
                sdk_role = "model" if role == "assistant" else "user"
                turns.append({"role": sdk_role, "parts": [content]})

        # Prepend the system instructions as a leading user turn.
        full_turns = list(turns)
        if system_prompt:
            full_turns = [{"role": "user", "parts": [system_prompt]}] + full_turns

        start = time.time()
        model = genai.GenerativeModel(self.model)

        try:
            # Use generate_content with chat history so conversation flows.
            chat = model.start_chat(history=full_turns[:-1])
            # The last turn is the current user query.
            user_query = full_turns[-1]["parts"][0] if full_turns else ""
            resp = chat.send_message(
                user_query,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                ),
            )
        except Exception as e:
            self._handle_exception(e)

        elapsed = int((time.time() - start) * 1000)

        try:
            content = resp.text
        except (AttributeError, ValueError):
            content = ""

        try:
            usage = resp.usage_metadata
            tokens = usage.total_token_count if usage else 0
        except Exception:
            tokens = 0

        return LLMResponse(
            content=content,
            tokens_used=tokens,
            model=self.model,
            latency_ms=elapsed,
        )

    def chat_completion_stream(self, messages: list[dict], temperature: float = 0.3):
        """Generator that yields tokens as they arrive (for the web widget SSE).

        Note: Google's streaming API returns chunks, the largest of which may be
        an entire sentence, not single tokens. We yield each returned text piece.
        """
        system_prompt = ""
        turns = []
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role == "system":
                system_prompt = content
            else:
                sdk_role = "model" if role == "assistant" else "user"
                turns.append({"role": sdk_role, "parts": [content]})

        full_turns = list(turns)
        if system_prompt:
            full_turns = [{"role": "user", "parts": [system_prompt]}] + full_turns

        model = genai.GenerativeModel(self.model)
        chat = model.start_chat(history=full_turns[:-1])
        user_query = full_turns[-1]["parts"][0] if full_turns else ""

        try:
            stream = chat.send_message(
                user_query,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                ),
                stream=True,
            )
            for chunk in stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            self._handle_exception(e)


# Backwards-compatible alias so existing imports keep working.
OpenCodeLLM = GeminiLLM


class LLMAPIError(Exception):
    """Generic LLM API error."""
    pass


class RateLimitError(Exception):
    """API rate limit exceeded."""
    pass
