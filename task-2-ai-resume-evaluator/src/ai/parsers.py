"""
Output parsers for AI Resume Evaluator LangChain chains.

Parses raw JSON from the LLM into validated Pydantic models.
Handles malformed JSON with retry logic.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

from langchain_core.output_parsers import BaseOutputParser

from src.models.schemas import Evaluation

logger = logging.getLogger(__name__)


class EvaluationParser(BaseOutputParser[Evaluation]):
    """
    Parse raw LLM JSON output into a validated Evaluation Pydantic model.

    Handles:
    - Valid JSON matching the schema → returns Evaluation
    - Malformed JSON → raises ValueError with parsing error details
    - Missing required fields → Pydantic validation error
    """

    def parse(self, text: str) -> Evaluation:
        """
        Parse LLM output string into Evaluation model.

        Args:
            text: Raw JSON string from the LLM.

        Returns:
            Validated Evaluation instance.

        Raises:
            ValueError: If JSON is malformed or fails schema validation.
        """
        # Clean the response — strip markdown code fences if present
        cleaned = text.strip()
        if cleaned.startswith("```"):
            # Remove opening fence (```json or ```)
            cleaned = cleaned.split("\n", 1)[-1]
            # Remove closing fence
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[0].strip()

        try:
            data: dict[str, Any] = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.warning("Failed to parse LLM JSON output: %s", exc)
            raise ValueError(
                f"Invalid JSON from LLM: {exc}"
            ) from exc

        # Validate with Pydantic
        try:
            evaluation = Evaluation(**data)
        except Exception as exc:
            logger.warning("Pydantic validation failed: %s", exc)
            raise ValueError(f"Schema validation failed: {exc}") from exc

        return evaluation

    @property
    def _type(self) -> str:
        return "evaluation_parser"
