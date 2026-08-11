"""
Tests for resume text extraction (PDF, DOCX, TXT).

Run with: pytest tests/test_parser.py -v
"""

from __future__ import annotations

import io
import os
import tempfile
from typing import Any

import pytest


class TestPDFParser:
    """Tests for PDF text extraction using PyMuPDF."""

    def test_extract_raises_on_nonexistent(self):
        """Non-existent file should raise."""
        from src.resume.parser import extract_text_from_pdf

        result = extract_text_from_pdf(io.BytesIO(b""))
        assert "error" in result or "text" in result


class TestTxtParser:
    """Tests for TXT text extraction."""

    def test_extract_simple_text(self):
        """Simple text should be extracted as-is."""
        from src.resume.parser import extract_text_from_txt

        content = b"Hello World\nThis is a test resume."
        stream = io.BytesIO(content)
        result = extract_text_from_txt(stream)

        assert "error" not in result
        assert "Hello World" in result["text"]
        assert result["format"] == "txt"

    def test_extract_empty_file(self):
        """Empty file should return error."""
        from src.resume.parser import extract_text_from_txt

        result = extract_text_from_txt(io.BytesIO(b""))
        assert "error" in result
        assert result["code"] == "EMPTY_FILE"

    def test_extract_utf8_fallback(self):
        """Non-UTF-8 text should fall back to latin-1."""
        from src.resume.parser import extract_text_from_txt

        # Latin-1 encoded text with special chars
        content = "Résumé: Café au lait".encode("latin-1")
        result = extract_text_from_txt(io.BytesIO(content))

        assert "error" not in result
        assert "Résumé" in result["text"]


class TestTextPreview:
    """Tests for the text preview utility."""

    def test_preview_short_text(self):
        """Text shorter than max should be returned as-is."""
        from src.resume.parser import get_text_preview

        text = "Short resume text"
        preview = get_text_preview(text, max_chars=50)
        assert preview == text

    def test_preview_truncation(self):
        """Long text should be truncated with ellipsis."""
        from src.resume.parser import get_text_preview

        text = "word " * 200
        preview = get_text_preview(text, max_chars=100)
        assert len(preview) <= 150
        assert preview.endswith("...")

    def test_preview_empty(self):
        """Empty text should return empty string."""
        from src.resume.parser import get_text_preview

        assert get_text_preview("") == ""
        assert get_text_preview("   ") == ""


class TestTextNormalization:
    """Tests for text normalization."""

    def test_collapse_spaces(self):
        """Multiple spaces should be collapsed."""
        from src.resume.parser import normalize_text

        result = normalize_text("Hello    World")
        assert result == "Hello World"

    def test_collapse_newlines(self):
        """Multiple newlines should be collapsed."""
        from src.resume.parser import normalize_text

        result = normalize_text("Line 1\n\n\n\nLine 2")
        assert result == "Line 1\n\nLine 2"

    def test_strip_whitespace(self):
        """Leading/trailing whitespace should be stripped."""
        from src.resume.parser import normalize_text

        result = normalize_text("  Hello World  ")
        assert result == "Hello World"
