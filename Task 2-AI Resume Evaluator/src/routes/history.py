"""
History routes — evaluation history dashboard.

Displays past evaluations with stats and allows viewing/deleting results.
"""

from __future__ import annotations

import json
import os
import shutil
from typing import Any, Optional

from flask import Blueprint, flash, redirect, render_template, request, url_for

from config import Config
from src.routes.auth import get_current_user, login_required

history_bp = Blueprint("history", __name__, url_prefix="/history")


def _get_user_evaluations(user_id: str) -> list[dict[str, Any]]:
    """Get all evaluations for a user, sorted newest-first."""
    evals_dir = os.path.join(Config.DATA_DIR, "evaluations", user_id)
    if not os.path.exists(evals_dir):
        return []

    evaluations = []
    for filename in sorted(os.listdir(evals_dir), reverse=True):
        if not filename.endswith(".json"):
            continue
        path = os.path.join(evals_dir, filename)
        try:
            with open(path, "r") as f:
                data = json.load(f)
                evaluations.append(data)
        except (json.JSONDecodeError, IOError):
            continue

    return evaluations


@history_bp.route("/")
@login_required
def index():
    """Display the evaluation history page."""
    user = get_current_user()
    if not user:
        return redirect(url_for("auth.login"))

    user_id = user["user_id"]
    evaluations = _get_user_evaluations(user_id)

    # Calculate stats
    total = len(evaluations)
    avg_score = 0
    if total > 0:
        scores = [e.get("overall_score", 0) for e in evaluations if e.get("overall_score") is not None]
        avg_score = round(sum(scores) / len(scores)) if scores else 0

    recent = evaluations[:5]

    return render_template(
        "history.html",
        evaluations=recent,
        total_evaluations=total,
        average_score=avg_score,
    )


@history_bp.route("/all")
@login_required
def all_history():
    """Display all evaluations (paginated)."""
    user = get_current_user()
    if not user:
        return redirect(url_for("auth.login"))

    user_id = user["user_id"]
    evaluations = _get_user_evaluations(user_id)

    # Basic pagination
    page = request.args.get("page", 1, type=int)
    per_page = 10
    total = len(evaluations)
    total_pages = max(1, (total + per_page - 1) // per_page)
    page = max(1, min(page, total_pages))

    start = (page - 1) * per_page
    end = start + per_page
    page_evals = evaluations[start:end]

    return render_template(
        "history.html",
        evaluations=page_evals,
        total_evaluations=total,
        page=page,
        total_pages=total_pages,
        show_all=True,
    )


@history_bp.route("/delete/<eval_id>", methods=["POST"])
@login_required
def delete(eval_id: str):
    """Delete a single evaluation."""
    user = get_current_user()
    if not user:
        return redirect(url_for("auth.login"))

    user_id = user["user_id"]
    eval_path = os.path.join(Config.DATA_DIR, "evaluations", user_id, f"{eval_id}.json")

    if os.path.exists(eval_path):
        os.remove(eval_path)

        # Also remove from user JSON
        from src.routes.auth import _load_user, _save_user
        user_data = _load_user(user_id)
        if user_data and "evaluations" in user_data:
            user_data["evaluations"] = [
                e for e in user_data["evaluations"]
                if e.get("id") != eval_id
            ]
            user_data["total_evaluations"] = len(user_data["evaluations"])
            _save_user(user_id, user_data)

        flash("Evaluation deleted.", "success")
    else:
        flash("Evaluation not found.", "error")

    return redirect(url_for("history.index"))
