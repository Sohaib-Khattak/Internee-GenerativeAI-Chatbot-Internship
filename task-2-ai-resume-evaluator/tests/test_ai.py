"""
Tests for AI evaluation (LangChain, DeepSeek v4, Pydantic schemas).

Run with: pytest tests/test_ai.py -v
"""

from __future__ import annotations

import json
from typing import Any

import pytest


class TestEvaluationSchema:
    """Tests for Pydantic evaluation schemas."""

    def test_valid_evaluation(self):
        """Valid data should create Evaluation instance."""
        from src.models.schemas import Evaluation, Category

        categories = [
            Category(
                name="Experience Relevance",
                score=80,
                reasoning="Strong alignment with software engineering roles.",
                suggestions=["Add more system design details."],
            )
        ]

        eval = Evaluation(
            overall_score=80,
            categories=categories,
            summary="Strong resume overall.",
            strengths=["Good experience"],
            improvements=None,
        )

        assert eval.overall_score == 80
        assert len(eval.categories) == 1
        assert eval.categories[0].score == 80

    def test_score_range_enforced(self):
        """Scores outside 0-100 should be rejected."""
        from src.models.schemas import Category
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            Category(
                name="Test",
                score=150,
                reasoning="x" * 10,
                suggestions=["Fix this"],
            )

        with pytest.raises(ValidationError):
            Category(
                name="Test",
                score=-5,
                reasoning="x" * 10,
                suggestions=["Fix this"],
            )

    def test_min_reasoning_length(self):
        """Reasoning must be at least 10 characters."""
        from src.models.schemas import Category
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            Category(
                name="Test",
                score=50,
                reasoning="Short",  # Less than 10 chars
                suggestions=["Fix this"],
            )

    def test_categories_required(self):
        """At least one category is required."""
        from src.models.schemas import Evaluation
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            Evaluation(
                overall_score=50,
                categories=[],  # Empty list — violates min_length=1
                summary=None,
            )

    def test_improvement_priority_validation(self):
        """Improvement priority must be high/medium/low."""
        from src.models.schemas import Improvement
        from pydantic import ValidationError

        # Valid priorities
        for priority in ["high", "medium", "low"]:
            imp = Improvement(
                issue="Test issue",
                suggestion="Test suggestion",
                priority=priority,
            )
            assert imp.priority == priority

        # Invalid priority
        with pytest.raises(ValidationError):
            Improvement(
                issue="Test",
                suggestion="Test",
                priority="urgent",
            )


class TestScoreCalculations:
    """Tests for score calculation utilities."""

    def test_weighted_average(self):
        """Overall score should be weighted average."""
        from src.models.schemas import calculate_overall_score, Category

        categories = [
            Category(name="Experience Relevance", score=100, reasoning="x" * 10, suggestions=["a"]),
            Category(name="Skills & Keywords", score=100, reasoning="x" * 10, suggestions=["a"]),
            Category(name="Achievements & Impact", score=100, reasoning="x" * 10, suggestions=["a"]),
            Category(name="Education & Credentials", score=100, reasoning="x" * 10, suggestions=["a"]),
            Category(name="Format & Clarity", score=100, reasoning="x" * 10, suggestions=["a"]),
            Category(name="ATS Compatibility", score=100, reasoning="x" * 10, suggestions=["a"]),
        ]

        score = calculate_overall_score(categories)
        assert score == 100

    def test_zero_scores(self):
        """All zeros should give zero."""
        from src.models.schemas import calculate_overall_score, Category

        categories = [
            Category(name="Experience Relevance", score=0, reasoning="x" * 10, suggestions=["a"]),
            Category(name="Skills & Keywords", score=0, reasoning="x" * 10, suggestions=["a"]),
            Category(name="Achievements & Impact", score=0, reasoning="x" * 10, suggestions=["a"]),
            Category(name="Education & Credentials", score=0, reasoning="x" * 10, suggestions=["a"]),
            Category(name="Format & Clarity", score=0, reasoning="x" * 10, suggestions=["a"]),
            Category(name="ATS Compatibility", score=0, reasoning="x" * 10, suggestions=["a"]),
        ]

        score = calculate_overall_score(categories)
        assert score == 0

    def test_empty_categories(self):
        """Empty list should return 0."""
        from src.models.schemas import calculate_overall_score

        score = calculate_overall_score([])
        assert score == 0


class TestScoreColors:
    """Tests for score color mapping."""

    def test_excellent_range(self):
        """81-100 should be teal."""
        from src.models.schemas import get_score_color, get_score_label

        assert get_score_color(81) == "#14b8a6"
        assert get_score_color(100) == "#14b8a6"
        assert get_score_label(81) == "Excellent"

    def test_good_range(self):
        """61-80 should be blue."""
        from src.models.schemas import get_score_color, get_score_label

        assert get_score_color(61) == "#3b82f6"
        assert get_score_color(80) == "#3b82f6"
        assert get_score_label(61) == "Good"

    def test_fair_range(self):
        """41-60 should be amber."""
        from src.models.schemas import get_score_color, get_score_label

        assert get_score_color(41) == "#f59e0b"
        assert get_score_color(60) == "#f59e0b"
        assert get_score_label(41) == "Fair"

    def test_critical_range(self):
        """0-40 should be red."""
        from src.models.schemas import get_score_color, get_score_label

        assert get_score_color(0) == "#ef4444"
        assert get_score_color(40) == "#ef4444"
        assert get_score_label(0) == "Critical"


class TestPIIMasking:
    """Tests for PII masking utilities."""

    def test_mask_email(self):
        """Email addresses should be masked."""
        from src.resume.pii import mask_pii

        result = mask_pii("Contact me at john.doe@example.com")
        assert "[EMAIL REDACTED]" in result
        assert "john.doe@example.com" not in result

    def test_mask_phone(self):
        """Phone numbers should be masked."""
        from src.resume.pii import mask_pii

        result = mask_pii("Call me at +1 (555) 123-4567")
        assert "[PHONE REDACTED]" in result

    def test_mask_url(self):
        """URLs should be masked."""
        from src.resume.pii import mask_pii

        result = mask_pii("Check my work at https://linkedin.com/in/johndoe")
        assert "[URL REDACTED]" in result

    def test_mask_multiple_pii(self):
        """Multiple PII items should all be masked."""
        from src.resume.pii import mask_pii

        text = "Email: john@test.com, Phone: 555-123-4567, Web: https://example.com"
        result = mask_pii(text)
        assert "[EMAIL REDACTED]" in result
        assert "[PHONE REDACTED]" in result
        assert "[URL REDACTED]" in result

    def test_mask_name_enabled(self):
        """Name should be masked when enabled."""
        from src.resume.pii import mask_name

        result = mask_name("John Doe\nSoftware Engineer", enabled=True)
        assert "[NAME REDACTED]" in result
        assert "John Doe" not in result

    def test_mask_name_disabled(self):
        """Name should NOT be masked when disabled."""
        from src.resume.pii import mask_name

        text = "John Doe\nSoftware Engineer"
        result = mask_name(text, enabled=False)
        assert result == text

    def test_mask_all(self):
        """mask_all should apply all masking."""
        from src.resume.pii import mask_all

        result = mask_all(
            "John Doe\nEmail: john@test.com\nCall: 555-123-4567",
            anonymous=True,
        )
        assert "[NAME REDACTED]" in result
        assert "[EMAIL REDACTED]" in result
        assert "[PHONE REDACTED]" in result
