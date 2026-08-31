"""Roman Urdu normalizer and language detector.

Common code-switched patterns for Pakistani tech interns:
- "mujhe task samajh nahi aya" (I don't understand the task)
- "stipend kab aayega?" (When will stipend come?)
- "yeh deadline extend ho sakti hai?" (Can this deadline be extended?)
- "main weekend mein deploy karunga" (I will deploy on the weekend)
"""
import re
from enum import Enum


class Language(Enum):
    ENGLISH = "en"
    ROMAN_URDU = "roman_urdu"
    CODE_SWITCHED = "mixed"
    UNKNOWN = "unknown"


# Common Roman Urdu words (canonical form)
ROMAN_URDU_WORDS = {
    "mujhe", "mujhy", "mujhay", "muje",
    "aap", "ap", "tum", "main", "mein", "hum",
    "hai", "hy", "hay", "he", "hain", "ho", "hoga",
    "kya", "kia", "kyu", "kyun",
    "nahi", "nhi", "ni", "nhe",
    "chahiye", "chaiye", "chahye", "chaheye",
    "karna", "karo", "karein", "kar", "karta", "karti",
    "sakta", "sakti", "sakte",
    "yeh", "ye", "woh", "wo",
    "acha", "theek", "thk",
    "ka", "ki", "ke", "se", "ko", "par", "pe",
    "liye", "wala", "wali", "walay",
    "thora", "thori", "kuch",
    "bas", "warna", "waise",
    "jao", "ja", "jata", "jaega",
    "de", "do", "dega", "deta",
    "batayein", "batao", "bata",
    "samajh", "samjha", "samjh",
    "aata", "aati", "aate",
    "raha", "rahi", "rahe",
    "sirf", "lekin", "magar",
    "kal", "aaj", "parson",
    "bahut", "bohat", "zyada",
}

# Common English tech terms used by Pakistani interns
TECH_TERMS = {
    "task", "deadline", "submit", "submission", "deploy", "branch",
    "commit", "push", "pull", "merge", "pr", "review", "bug", "fix",
    "server", "database", "api", "endpoint", "login", "password",
    "credential", "reset", "portal", "dashboard", "report",
    "meeting", "minutes", "feedback", "mentor", "manager", "hr",
    "stipend", "certificate", "leave", "attendance", "timing",
    "project", "code", "repo", "github", "git", "docker",
    "frontend", "backend", "fullstack", "intern", "internship",
    "weekend", "holiday", "schedule", "slot",
}

# Normalization mapping: variant -> canonical form
NORMALIZATION_MAP = {
    "mujhy": "mujhe", "mujhay": "mujhe", "muje": "mujhe", "mujy": "mujhe",
    "kya": "kya", "kia": "kya",
    "hai": "hai", "hy": "hai", "hay": "hai", "he": "hai", "hain": "hai",
    "nahi": "nahi", "nhi": "nahi", "ni": "nahi", "nhe": "nahi",
    "chaiye": "chahiye", "chaheye": "chahiye", "chahye": "chahiye", "chaiy": "chahiye",
    "karo": "karo", "kro": "karo", "karein": "karein", "kren": "karein",
    "theek": "theek", "thk": "theek", "tik": "theek", "thek": "theek",
    "aap": "aap", "ap": "aap",
    "mein": "mein", "mai": "mein", "me": "mein", "main": "mein",
    "thora": "thora", "thoda": "thora", "thora": "thora",
    "bahut": "bahut", "bohat": "bahut",
    "samajh": "samajh", "samjha": "samajh", "samjh": "samajh",
    "acha": "acha", "accha": "acha", "theek": "theek",
    "kuch": "kuch", "kch": "kuch", "kuCh": "kuch",
    "sakta": "sakta", "sakhta": "sakta",
    "aata": "aata", "ata": "aata", "aataa": "aata",
}


class UrduNormalizer:
    """Normalize Roman Urdu text for consistent processing."""

    def __init__(self):
        self._normalization_map = NORMALIZATION_MAP

    def normalize(self, text: str) -> str:
        """Normalize a query: lowercase, normalize Roman Urdu spellings."""
        text = text.lower().strip()
        tokens = text.split()
        normalized = []
        for token in tokens:
            # Remove common punctuation attached to tokens
            clean = token.strip(".,!?;:'\"()[]{}")
            # Normalize if in map
            if clean in self._normalization_map:
                clean = self._normalization_map[clean]
            normalized.append(clean)
        return " ".join(normalized)


class LanguageDetector:
    """Detect language(s) used in a query."""

    URDU_UNICODE = r'[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]'

    def __init__(self):
        self._roman_urdu_words = ROMAN_URDU_WORDS
        self._tech_terms = TECH_TERMS

    def detect(self, text: str) -> Language:
        """Determine language: English, Roman Urdu, or Mixed."""
        has_urdu_script = bool(re.search(self.URDU_UNICODE, text))
        tokens = set(re.findall(r'\w+', text.lower()))

        # Count Roman Urdu words (allowing for exact matches + slight variants)
        roman_urdu_count = len(tokens & self._roman_urdu_words)

        # Count English words (exclude tech terms from English detection)
        english_words = tokens - self._roman_urdu_words - self._tech_terms
        # Heuristic: 3+ letter words not in Roman Urdu set = English
        english_count = sum(1 for w in english_words if len(w) >= 2)

        if has_urdu_script and roman_urdu_count > 0:
            return Language.CODE_SWITCHED
        if roman_urdu_count > 0 and english_count > 0:
            return Language.CODE_SWITCHED
        if roman_urdu_count > 0:
            return Language.ROMAN_URDU
        return Language.ENGLISH


def preprocess_query(query: str) -> str:
    """Full preprocessing pipeline."""
    normalizer = UrduNormalizer()
    return normalizer.normalize(query)
