"""
Results routes — evaluation execution and results display.

Handles:
- Running the AI evaluation (POST /evaluate)
- Displaying stored results (GET /results/<eval_id>)
- Slow evaluation handling (loading state + retry)
"""

from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import uuid4

from flask import (
    Blueprint,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

from config import Config
from src.ai.chains import evaluate_resume
from src.models.schemas import (
    Evaluation,
    calculate_overall_score,
    get_score_color,
    get_score_label,
)
from src.routes.auth import get_current_user, login_required
from src.resume.validator import check_daily_limit

results_bp = Blueprint("results", __name__)


def _load_evaluation(user_id: str, eval_id: str) -> Optional[dict[str, Any]]:
    """Load a stored evaluation by ID."""
    path = os.path.join(Config.DATA_DIR, "evaluations", user_id, f"{eval_id}.json")
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return None


def _save_evaluation(user_id: str, eval_id: str, data: dict[str, Any]) -> None:
    """Save an evaluation result to disk."""
    path = os.path.join(Config.DATA_DIR, "evaluations", user_id)
    os.makedirs(path, exist_ok=True)
    filepath = os.path.join(path, f"{eval_id}.json")
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)


def _update_user_evaluations(user_id: str, eval_data: dict[str, Any]) -> None:
    """Append evaluation metadata to user's JSON record."""
    from src.routes.auth import _load_user, _save_user

    user = _load_user(user_id)
    if not user:
        return

    if "evaluations" not in user:
        user["evaluations"] = []

    user["evaluations"].insert(0, eval_data)
    user["total_evaluations"] = len(user["evaluations"])
    _save_user(user_id, user)


@results_bp.route("/evaluate", methods=["POST"])
@login_required
def evaluate():
    """
    Run the AI evaluation on the resume text stored in session.

    Calls LangChain evaluation chain, validates with Pydantic,
    stores the result, and redirects to the results page.
    """
    user = get_current_user()
    if not user:
        return redirect(url_for("auth.login"))

    user_id = user["user_id"]

    # Check daily limit
    if not check_daily_limit(user):
        flash(
            f"Daily evaluation limit reached ({Config.FREE_TIER_DAILY_LIMIT}/"
            f"{Config.FREE_TIER_DAILY_LIMIT}). Upgrade to Pro for unlimited evaluations.",
            "warning",
        )
        return redirect(url_for("upload.index"))

    # Get resume text from session
    resume_text = session.get("resume_text", "")
    if not resume_text:
        flash("No resume text found. Please upload your resume first.", "error")
        return redirect(url_for("upload.index"))

    target_role = session.get("target_role", "")
    anonymous = session.get("anonymous_eval", False)

    # Run evaluation
    result = evaluate_resume(
        resume_text=resume_text,
        target_role=target_role,
        max_retries=1,
    )

    if not result["success"]:
        flash(result.get("error", "Evaluation failed. Please try again."), "error")
        return redirect(url_for("upload.index"))

    evaluation: Evaluation = result["evaluation"]

    if not evaluation:
        flash("Evaluation returned no result. Please try again.", "error")
        return redirect(url_for("upload.index"))

    # Ensure overall score is calculated
    if evaluation.categories and not evaluation.overall_score:
        evaluation.overall_score = calculate_overall_score(evaluation.categories)

    # Prepare stored data
    eval_id = f"eval_{uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    eval_dict = evaluation.model_dump()
    eval_dict["id"] = eval_id
    eval_dict["created_at"] = now
    eval_dict["file_name"] = session.get("resume_filename", "unknown")
    eval_dict["file_format"] = session.get("resume_format", "")
    eval_dict["anonymous"] = anonymous
    eval_dict["target_role"] = target_role if target_role else None
    eval_dict["latency_ms"] = result.get("latency_ms", 0)

    # Handle Evaluation model
    if isinstance(eval_dict.get("evaluation"), dict):
        eval_dict.update(eval_dict.pop("evaluation"))

    # Save evaluation
    _save_evaluation(user_id, eval_id, eval_dict)

    # Update user record
    _update_user_evaluations(user_id, {
        "id": eval_id,
        "created_at": now,
        "file_name": session.get("resume_filename", "unknown"),
        "overall_score": evaluation.overall_score,
        "status": "completed",
    })

    # Clear session data (keep auth)
    for key in ["resume_text", "resume_filename", "resume_pages",
                "resume_format", "resume_truncated", "anonymous_eval",
                "target_role"]:
        session.pop(key, None)

    return redirect(url_for("results.view", eval_id=eval_id))


@results_bp.route("/results/<eval_id>")
@login_required
def view(eval_id: str):
    """Display a stored evaluation result."""
    user = get_current_user()
    if not user:
        return redirect(url_for("auth.login"))

    user_id = user["user_id"]
    evaluation = _load_evaluation(user_id, eval_id)

    if not evaluation:
        flash("Evaluation not found.", "error")
        return redirect(url_for("history.index"))

    return render_template(
        "results.html",
        evaluation=evaluation,
        get_score_color=get_score_color,
        get_score_label=get_score_label,
    )
