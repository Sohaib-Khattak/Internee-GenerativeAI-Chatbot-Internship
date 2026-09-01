"""Local web host for the Career Path Recommender.

A small Flask app that reuses the existing recommender, progress, and profile
modules behind a browser UI. Starts with `python -m src.web` (default
http://127.0.0.1:5000).

Endpoints (JSON):
  GET  /                    -> the single-page UI
  POST /api/recommend       {skills:[], interests:[], profile_id?}       -> RecommendationResult
  POST /api/learning_path   {role_id, skills:[], interests:[], profile_id?, llm?}
  POST /api/progress        {profile_id, role_id, milestone}             -> record done
  GET  /api/progress        ?profile_id=                                 -> history
"""

from __future__ import annotations

import os
from typing import List, Optional

from flask import Flask, jsonify, request, send_from_directory

from .matcher import GeminiEmbeddingMatcher, HeuristicMatcher
from .normalize import load_catalogue
from .progress import InvalidMilestoneError, ProgressStore
from .recommender import ProfileInput, RecommendationError, Recommender, DISCLAIMER

# Paths relative to the project root (web.py lives in src/).
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOGUE_PATH = os.path.join(ROOT, "data", "catalogue.json")

app = Flask(__name__)

_catalogue = load_catalogue(CATALOGUE_PATH)


def _build_recommender(use_gemini: bool = False) -> Recommender:
    if use_gemini:
        return Recommender(_catalogue, matcher=GeminiEmbeddingMatcher())
    return Recommender(_catalogue, matcher=HeuristicMatcher())


def _progress_store() -> ProgressStore:
    return ProgressStore(os.path.join(ROOT, "data", "progress.db"))


def _profile_store():
    from .profile_store import ProfileStore

    return ProfileStore(os.path.join(ROOT, "data", "profiles.db"))


@app.get("/")
def index():
    static_dir = os.path.join(ROOT, "static")
    return send_from_directory(static_dir, "index.html")


@app.get("/<path:path>")
def static_files(path):
    static_dir = os.path.join(ROOT, "static")
    return send_from_directory(static_dir, path)


@app.post("/api/recommend")
def api_recommend():
    body = request.get_json(silent=True) or {}
    skills = body.get("skills") or []
    interests = body.get("interests") or []
    profile_id = body.get("profile_id")
    use_gemini = bool(body.get("gemini"))

    rec = _build_recommender(use_gemini)
    progress = _progress_store() if profile_id else None
    try:
        res = rec.recommend(
            ProfileInput(skills=skills, interests=interests),
            progress=progress,
            profile_id=profile_id,
        )
        return jsonify(
            {
                "completeness": res.completeness,
                "message": res.message,
                "conflict_asked": res.conflict_asked,
                "unverified_terms": res.unverified_terms,
                "catalogue_version": res.catalogue_version,
                "disclaimer": res.disclaimer,
                "candidates": res.candidates,
            }
        )
    except RecommendationError as exc:
        return jsonify({"error": str(exc)}), 500
    finally:
        if progress:
            progress.close()


@app.post("/api/learning_path")
def api_learning_path():
    from .learning_path import UnknownRoleError

    body = request.get_json(silent=True) or {}
    role_id = body.get("role_id")
    skills = body.get("skills") or []
    interests = body.get("interests") or []
    profile_id = body.get("profile_id")
    llm = bool(body.get("llm"))
    use_gemini = bool(body.get("gemini"))

    rec = _build_recommender(use_gemini)
    progress = _progress_store() if profile_id else None
    try:
        path = rec.learning_path(
            ProfileInput(skills=skills, interests=interests),
            role_id=role_id,
            refine_with_llm=llm,
            progress=progress,
            profile_id=profile_id,
        )
        return jsonify(
            {
                "role_id": path.role_id,
                "role_title": path.role_title,
                "disclaimer": path.disclaimer,
                "milestones": [
                    {
                        "order": m.order,
                        "skill": m.skill,
                        "title": m.title,
                        "resources": m.resources,
                        "rationale": m.rationale,
                    }
                    for m in path.milestones
                ],
            }
        )
    except UnknownRoleError as exc:
        return jsonify({"error": str(exc)}), 404
    finally:
        if progress:
            progress.close()


@app.post("/api/generate")
def api_generate():
    """LLM-generative mode: create bespoke roles + a learning path from free input."""
    from .generator import GeminiNotAvailableError, generate

    body = request.get_json(silent=True) or {}
    skills = body.get("skills") or []
    interests = body.get("interests") or []
    top_n = int(body.get("top_n", 3))
    try:
        res = generate(skills=skills, interests=interests, top_n=top_n)
    except GeminiNotAvailableError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:  # LLM/network failure -> clear message, no partial result
        return jsonify({"error": "The AI could not generate content right now."}), 502
    return jsonify(
        {
            "roles": [
                {
                    "title": r.title, "why": r.why,
                    "matched_skills": r.matched_skills,
                    "missing_skills": r.missing_skills,
                }
                for r in res.roles
            ],
            "path": [
                {
                    "order": m.order, "skill": m.skill, "title": m.title,
                    "rationale": m.rationale, "resources": m.resources,
                }
                for m in res.path
            ],
            "disclaimer": res.disclaimer,
        }
    )


@app.post("/api/progress")
def api_progress_record():
    body = request.get_json(silent=True) or {}
    profile_id = body.get("profile_id")
    role_id = body.get("role_id")
    try:
        milestone = int(body.get("milestone"))
    except (TypeError, ValueError):
        return jsonify({"error": "milestone must be an integer"}), 400
    store = _progress_store()
    try:
        ev = store.record_done(profile_id, role_id, milestone, _catalogue)
    except InvalidMilestoneError as exc:
        return jsonify({"error": str(exc)}), 400
    finally:
        store.close()
    if ev is None:
        return jsonify({"recorded": False, "message": "Already recorded."})
    return jsonify(
        {"recorded": True, "profile_id": ev.profile_id, "role_id": ev.role_id,
         "milestone": ev.milestone_order, "skill": ev.skill}
    )


@app.get("/api/progress")
def api_progress_history():
    profile_id = request.args.get("profile_id")
    store = _progress_store()
    try:
        events = store.history(profile_id)
    finally:
        store.close()
    return jsonify(
        {
            "events": [
                {"role_id": e.role_id, "milestone": e.milestone_order,
                 "skill": e.skill, "ts": e.ts, "event_type": e.event_type}
                for e in events
            ]
        }
    )


@app.post("/api/profile")
def api_profile_save():
    body = request.get_json(silent=True) or {}
    profile_id = body.get("profile_id")
    store = _profile_store()
    try:
        saved = store.save(profile_id, body.get("skills") or [], body.get("interests") or [])
    finally:
        store.close()
    return jsonify(
        {"profile_id": saved.profile_id, "skills": saved.skills,
         "interests": saved.interests, "last_saved": saved.last_saved}
    )




def main():
    app.run(host="127.0.0.1", port=5000, debug=False)


if __name__ == "__main__":
    main()
