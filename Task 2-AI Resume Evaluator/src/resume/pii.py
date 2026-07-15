"""
PII masking utilities for AI Resume Evaluator.

Strips personally identifiable information from resume text before sending
it to the LLM. This is a critical fairness and privacy feature.

Usage:
    from src.resume.pii import mask_pii, mask_name

    cleaned = mask_pii(raw_resume_text)
    anonymous = mask_name(cleaned, enabled=True)
"""

from __future__ import annotations

import re
from typing import Optional


def mask_pii(text: str) -> str:
    """
    Remove personally identifiable information from resume text.

    Masks the following patterns:
    - Email addresses
    - Phone numbers (international and domestic)
    - URLs (web links, LinkedIn, GitHub, etc.)
    - Physical addresses (street, avenue, road, etc.)
    - Social media handles (@username patterns)

    Args:
        text: Raw resume text containing potential PII.

    Returns:
        Text with PII replaced by [REDACTED] markers.
    """
    # Email addresses
    text = re.sub(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        "[EMAIL REDACTED]",
        text,
    )

    # Phone numbers (various formats: +1 (555) 123-4567, 555-123-4567, etc.)
    text = re.sub(
        r"\+?\d{1,4}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,9}",
        "[PHONE REDACTED]",
        text,
    )

    # URLs (http, https, ftp)
    text = re.sub(
        r"https?://\S+(?:/\S*)?",
        "[URL REDACTED]",
        text,
    )

    # Physical addresses (basic US/UK/CA address patterns)
    text = re.sub(
        r"\d{1,5}\s+\w+(?:\s+\w+)*\s+(Street|St|Avenue|Ave|Road|Rd|"
        r"Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl|"
        r"Circle|Cir|Square|Sq|Highway|Hwy|Parkway|Pkwy)\b",
        "[ADDRESS REDACTED]",
        text,
        flags=re.IGNORECASE,
    )

    # LinkedIn and other profile URLs (even without http prefix)
    text = re.sub(
        r"\blinkedin\.com\S*",
        "[URL REDACTED]",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r"\bgithub\.com\S*",
        "[URL REDACTED]",
        text,
        flags=re.IGNORECASE,
    )

    # Social media handles (@username)
    text = re.sub(
        r"\B@\w{3,30}\b",
        "[HANDLE REDACTED]",
        text,
    )

    return text


def mask_name(text: str, enabled: bool = True) -> str:
    """
    Optionally mask the candidate's name from resume text.

    Used for anonymous evaluation feature. When enabled, detects and
    replaces name-like patterns at the start of the resume.

    This is an optional, best-effort masking — it may not catch all
    name patterns. The primary PII masking (mask_pii) is always applied.

    Args:
        text: Resume text (after PII masking).
        enabled: Whether to apply name masking.

    Returns:
        Text with name masked if enabled, unchanged otherwise.
    """
    if not enabled:
        return text

    # Pattern 1: "Name Name" at the very start of the text
    text = re.sub(
        r"^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}",
        "[NAME REDACTED]",
        text,
    )

    # Pattern 2: Title-prefixed names (Mr. John Smith, Dr. Jane Doe, etc.)
    text = re.sub(
        r"\b(Mr|Mrs|Ms|Miss|Dr|Prof|Hon|Rev)\.\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?",
        "[NAME REDACTED]",
        text,
    )

    # Pattern 3: Name in parentheses or after a colon at the start
    text = re.sub(
        r"(?i)^(name|contact|personal)\s*[:\-]\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+",
        r"\1: [NAME REDACTED]",
        text,
    )

    return text


def mask_all(text: str, anonymous: bool = False) -> str:
    """
    Apply all masking: always mask PII, optionally mask name.

    Convenience function for the upload/evaluation pipeline.

    Args:
        text: Raw resume text.
        anonymous: If True, also mask candidate name.

    Returns:
        Cleaned text ready for LLM evaluation.
    """
    text = mask_pii(text)
    if anonymous:
        text = mask_name(text)
    return text
