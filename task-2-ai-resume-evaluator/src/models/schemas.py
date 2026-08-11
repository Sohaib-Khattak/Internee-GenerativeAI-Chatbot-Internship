"""
Pydantic data models for AI Resume Evaluator.

All LLM outputs are validated against these schemas at the system boundary,
ensuring type safety and providing clear error messages on malformed output.

Scoring rubric:
  | Category                   | Weight | What It Measures                     |
  |----------------------------|--------|--------------------------------------|
  | Experience Relevance       | 30%    | Role alignment, career progression   |
  | Skills & Keywords          | 25%    | Hard skills, tools, technologies     |
  | Achievements & Impact      | 15%    | Quantified results, metrics          |
  | Education & Credentials    | 10%    | Degree relevance, certifications     |
  | Format & Clarity           | 10%    | Structure, readability, grammar      |
  | ATS Compatibility          | 10%    | Keyword density, parsability         |
"""

from __future__ import annotations

from typing import Any, List, Optional

from pydantic import BaseModel, Field


class Category(BaseModel):
    """A single evaluation category with score, reasoning, and suggestions."""

    name: str = Field(description="Category name (e.g., Experience Relevance)")
    score: int = Field(
        ge=0, le=100, description="Score out of 100 for this category"
    )
    reasoning: str = Field(
        min_length=10,
        description="Detailed explanation of why this score was given, citing specific resume content",
    )
    suggestions: list[str] = Field(
        min_length=1,
        description="Actionable suggestions to improve in this category",
    )


class Improvement(BaseModel):
    """A single improvement item with priority."""

    issue: str = Field(description="The specific issue identified")
    suggestion: str = Field(description="Concrete suggestion to address the issue")
    priority: str = Field(
        pattern=r"^(high|medium|low)$",
        description="Priority level: high, medium, or low",
    )


class ATSEvaluation(BaseModel):
    """ATS compatibility details."""

    score: int = Field(ge=0, le=100, description="ATS compatibility score")
    keyword_density: Optional[str] = Field(None, description="Keyword density assessment")
    formatting_issues: Optional[list[str]] = Field(
        None, description="Formatting issues detected"
    )
    recommendations: Optional[list[str]] = Field(
        None, description="Recommendations to improve ATS compatibility"
    )


class Evaluation(BaseModel):
    """
    Complete resume evaluation result.

    This is the primary output schema for the AI evaluation chain.
    All fields are validated by Pydantic after LLM response.
    """

    overall_score: int = Field(
        ge=0, le=100, description="Overall resume score (weighted average)"
    )
    categories: list[Category] = Field(
        min_length=1,
        max_length=10,
        description="Individual category scores",
    )
    summary: Optional[str] = Field(
        None,
        description="Brief executive summary of the evaluation (2-3 sentences)",
    )
    strengths: Optional[list[str]] = Field(
        None,
        description="Key strengths identified in the resume (categories scoring >= 70)",
    )
    improvements: Optional[list[Improvement]] = Field(
        None,
        description="Prioritized list of improvements needed",
    )
    bias_warnings: Optional[list[str]] = Field(
        None,
        description="Any potential bias detected in evaluation criteria or resume content",
    )
    ats_compatibility: Optional[ATSEvaluation] = Field(
        None,
        description="ATS compatibility analysis",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "overall_score": 74,
                "categories": [
                    {
                        "name": "Experience Relevance",
                        "score": 80,
                        "reasoning": "Strong alignment with software engineering roles...",
                        "suggestions": ["Add more details about system architecture work"],
                    }
                ],
                "summary": "Strong technical resume with quantified achievements.",
                "strengths": ["Strong technical background"],
                "improvements": [
                    {
                        "issue": "Missing industry keywords",
                        "suggestion": "Add terms like: Python, AWS, Docker",
                        "priority": "high",
                    }
                ],
            }
        },
    }


# Scoring weights — used for overall_score calculation
CATEGORY_WEIGHTS: dict[str, float] = {
    "Experience Relevance": 0.30,
    "Skills & Keywords": 0.25,
    "Achievements & Impact": 0.15,
    "Education & Credentials": 0.10,
    "Format & Clarity": 0.10,
    "ATS Compatibility": 0.10,
}


def calculate_overall_score(categories: list[Category]) -> int:
    """
    Calculate weighted overall score from category scores.

    Uses the predefined CATEGORY_WEIGHTS mapping.
    Falls back to simple average for unrecognized category names.

    Args:
        categories: List of Category objects with name and score.

    Returns:
        Rounded integer score (0-100).
    """
    total_weight = 0.0
    weighted_sum = 0.0

    for cat in categories:
        weight = CATEGORY_WEIGHTS.get(cat.name, 1.0 / len(categories))
        weighted_sum += cat.score * weight
        total_weight += weight

    if total_weight == 0:
        return 0

    return round(weighted_sum / total_weight)


def get_score_color(score: int) -> str:
    """
    Map a numeric score to its display color.

    Args:
        score: Score value (0-100).

    Returns:
        CSS color hex string.
    """
    if score >= 81:
        return "#14b8a6"  # teal (excellent)
    if score >= 61:
        return "#3b82f6"  # blue (good)
    if score >= 41:
        return "#f59e0b"  # amber (fair)
    return "#ef4444"  # red (critical)


def get_score_label(score: int) -> str:
    """Get human-readable label for a score value."""
    if score >= 81:
        return "Excellent"
    if score >= 61:
        return "Good"
    if score >= 41:
        return "Fair"
    return "Critical"
