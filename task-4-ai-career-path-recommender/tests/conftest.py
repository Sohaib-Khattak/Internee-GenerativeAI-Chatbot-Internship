"""Shared fixtures for Feature 1 acceptance tests."""

import os
import sys

import pytest

# Allow `import src.*` from the repo root.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.normalize import load_catalogue  # noqa: E402
from src.matcher import HeuristicMatcher  # noqa: E402
from src.recommender import Recommender  # noqa: E402


@pytest.fixture(scope="session")
def catalogue():
    return load_catalogue("data/catalogue.json")


@pytest.fixture
def recommender(catalogue):
    # HeuristicMatcher: deterministic, offline (AC tests run with zero network/API).
    return Recommender(catalogue, matcher=HeuristicMatcher())
