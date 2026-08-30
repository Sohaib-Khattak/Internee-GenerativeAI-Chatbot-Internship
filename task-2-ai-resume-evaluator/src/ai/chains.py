"""
LangChain chains for resume evaluation.

Orchestrates the prompt → LLM → parser pipeline for evaluating resumes
using DeepSeek v4 via the OpenCode Zen API.

Uses the LangChain Expression Language (LCEL) for modern chain composition.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Optional

from langchain_core.runnables import RunnableSequence
from langchain_google_genai import ChatGoogleGenerativeAI

from config import Config
from src.ai.parsers import EvaluationParser
from src.ai.prompts import EVALUATION_PROMPT
from src.models.schemas import Evaluation, calculate_overall_score

logger = logging.getLogger(__name__)


def get_evaluation_chain() -> RunnableSequence:
    """
    Create and return a LangChain evaluation chain using LCEL.

    Chain: prompt template → Gemini LLM → Pydantic output parser

    Uses Google Gemini with JSON response format (response_mime_type).

    Returns:
        RunnableSequence that accepts {"resume_text": str, "target_role": str}
        and returns a validated Evaluation object.
    """
    llm = ChatGoogleGenerativeAI(
        model=Config.GEMINI_MODEL,
        google_api_key=Config.GEMINI_API_KEY,
        temperature=0.3,
        max_tokens=4096,
        response_mime_type="application/json",
        timeout=60,
    )

    parser = EvaluationParser()

    # LCEL chain: prompt | llm | parser
    chain = EVALUATION_PROMPT | llm | parser

    return chain


def evaluate_resume(
    resume_text: str,
    target_role: str = "",
    max_retries: int = 1,
) -> dict[str, Any]:
    """
    Evaluate a resume using the LangChain evaluation chain.

    Args:
        resume_text: Extracted text from the resume.
        target_role: Optional target role/job description for context.
        max_retries: Number of retries on failure (default: 1).

    Returns:
        dict with keys:
            - 'success' (bool): Whether evaluation succeeded.
            - 'evaluation' (Evaluation | None): Validated result on success.
            - 'error' (str | None): Error message on failure.
            - 'error_code' (str | None): Machine-readable error code.
            - 'latency_ms' (int): Time taken in milliseconds.
    """
    # Handle empty text edge case
    if not resume_text or not resume_text.strip():
        return {
            "success": False,
            "evaluation": None,
            "error": "No resume text provided for evaluation.",
            "error_code": "EMPTY_TEXT",
            "latency_ms": 0,
        }

    # Truncate very long target roles
    effective_role = target_role
    if len(effective_role) > 2000:
        effective_role = effective_role[:2000] + "\n\n[Target role truncated due to length]"

    chain = get_evaluation_chain()

    start_time = time.time()
    last_error: Optional[str] = None

    for attempt in range(max_retries + 1):
        try:
            result: Evaluation = chain.invoke({
                "resume_text": resume_text,
                "target_role": effective_role,
            })

            # Ensure overall_score is calculated as weighted average
            if result.categories and not result.overall_score:
                result.overall_score = calculate_overall_score(result.categories)

            latency = int((time.time() - start_time) * 1000)

            logger.info(
                "Evaluation successful in %dms (attempt %d/%d)",
                latency,
                attempt + 1,
                max_retries + 1,
            )

            return {
                "success": True,
                "evaluation": result,
                "error": None,
                "error_code": None,
                "latency_ms": latency,
            }

        except Exception as exc:
            last_error = str(exc)
            logger.warning(
                "Evaluation attempt %d/%d failed: %s",
                attempt + 1,
                max_retries + 1,
                last_error,
            )

            if attempt < max_retries:
                time.sleep(1)  # Brief pause before retry

    latency = int((time.time() - start_time) * 1000)

    return {
        "success": False,
        "evaluation": None,
        "error": f"Evaluation failed after {max_retries + 1} attempts: {last_error}",
        "error_code": "AI_PROCESSING_ERROR",
        "latency_ms": latency,
    }
