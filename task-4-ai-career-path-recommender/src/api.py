"""CLI entry point for Feature 1 — exercise the tool interactively.

This is a thin delivery surface over the existing recommender + profile store
(no new behavior). It does NOT change the spec contract; it only lets a user drive
`recommend` and the profile save/get/delete flows from the command line.

Usage:
    python -m src.api recommend --skills python sql --interests data
    python -m src.api profile save --id intern-1 --skills python --interests data
    python -m src.api profile get --id intern-1
    python -m src.api profile delete --id intern-1
"""

from __future__ import annotations

import argparse
import json
import sys

from .matcher import GeminiEmbeddingMatcher, HeuristicMatcher
from .normalize import load_catalogue
from .profile_store import ProfileStore
from .recommender import ProfileInput, RecommendationError, Recommender


def _build_recommender(use_gemini: bool):
    catalogue = load_catalogue("data/catalogue.json")
    matcher = GeminiEmbeddingMatcher() if use_gemini else HeuristicMatcher()
    return Recommender(catalogue, matcher=matcher)


def _cmd_recommend(args):
    from .progress import ProgressStore

    r = _build_recommender(args.gemini)
    progress = ProgressStore("data/progress.db") if args.profile_id else None
    try:
        res = r.recommend(
            ProfileInput(skills=args.skills or [], interests=args.interests or []),
            progress=progress,
            profile_id=args.profile_id,
        )
    except RecommendationError as exc:
        print(f"Sorry: {exc}", file=sys.stderr)
        return 1
    finally:
        if progress:
            progress.close()

    print(f"Catalogue v{res.catalogue_version} | state: {res.completeness}")
    if res.message:
        print(res.message)
    for c in res.candidates:
        missing = ", ".join(c["missing_skills"]) or "(none)"
        flag = "  [matched by interest only]" if c["interest_only"] else ""
        full = "  [fully qualified]" if c.get("fully_qualified") else ""
        print(f"\n  [{c['fit_label']}] {c['title']}{flag}{full}")
        print(f"      have: {', '.join(c['matched_skills']) or '—'}")
        print(f"      need: {missing}")
    if res.unverified_terms:
        print(f"\nNot counted (confirm to include): {', '.join(res.unverified_terms)}")
    if res.conflict_asked:
        print(f"\n{res.conflict_asked}")
    if res.candidates:
        print(f"\n{res.disclaimer}")
    return 0


def _cmd_learning_path(args):
    from .learning_path import UnknownRoleError
    from .progress import ProgressStore

    r = _build_recommender(args.gemini)
    progress = ProgressStore("data/progress.db") if args.profile_id else None
    try:
        path = r.learning_path(
            ProfileInput(skills=args.skills or [], interests=args.interests or []),
            role_id=args.role_id,
            refine_with_llm=args.llm,
            progress=progress,
            profile_id=args.profile_id,
        )
    except UnknownRoleError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    finally:
        if progress:
            progress.close()

    print(f"Learning path: {path.role_title} ({path.role_id})")
    if not path.milestones:
        print("  You already cover the core skills for this role — nothing to re-learn.")
    for m in path.milestones:
        print(f"\n  {m.order}. {m.title}  [{m.skill}]")
        print(f"     why: {m.rationale}")
        if m.resources:
            print(f"     resources: {', '.join(m.resources)}")
    if path.milestones:
        print(f"\n{path.disclaimer}")
    return 0


def _cmd_progress_record(args):
    from .normalize import load_catalogue
    from .progress import InvalidMilestoneError, ProgressStore

    cat = load_catalogue("data/catalogue.json")
    store = ProgressStore("data/progress.db")
    try:
        ev = store.record_done(args.profile_id, args.role_id, args.milestone, cat)
    except InvalidMilestoneError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    finally:
        store.close()
    if ev is None:
        print(f"Already recorded: {args.profile_id} -> {args.role_id} #{args.milestone}.")
    else:
        print(f"Recorded: {args.profile_id} completed {args.role_id} milestone #{ev.milestone_order} ({ev.skill}).")
    return 0


def _cmd_progress_history(args):
    from .progress import ProgressStore

    store = ProgressStore("data/progress.db")
    try:
        events = store.history(args.profile_id)
    finally:
        store.close()
    print(f"Progress history for '{args.profile_id}': {len(events)} event(s)")
    for ev in events:
        print(f"  {ev.ts}  {ev.role_id} #{ev.milestone_order} ({ev.skill}) [{ev.event_type}]")
    return 0


def _cmd_profile_save(args):
    store = ProfileStore("data/profiles.db")
    try:
        saved = store.save(args.id, args.skills or [], args.interests or [])
        print(f"Saved profile {saved.profile_id}: skills={saved.skills} interests={saved.interests}")
        print(f"  created: {saved.created_at} | last saved: {saved.last_saved}")
    finally:
        store.close()
    return 0


def _cmd_profile_get(args):
    store = ProfileStore("data/profiles.db")
    try:
        prof = store.get(args.id)
        if prof is None:
            print(f"No profile found for id '{args.id}'.")
            return 1
        print(f"Profile {prof.profile_id}: skills={prof.skills} interests={prof.interests}")
        print(f"  created: {prof.created_at} | last saved: {prof.last_saved}")
    finally:
        store.close()
    return 0


def _cmd_profile_delete(args):
    store = ProfileStore("data/profiles.db")
    try:
        removed = store.delete(args.id)
        print(f"Deleted profile '{args.id}'." if removed else f"No profile '{args.id}' to delete.")
        return 0 if removed else 1
    finally:
        store.close()


def _parse(argv=None):
    parser = argparse.ArgumentParser(prog="career-rec", description="Career Path Recommender CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    rec = sub.add_parser("recommend", help="get a role recommendation")
    rec.add_argument("--skills", nargs="*", default=[], help="confirmed skills (free text)")
    rec.add_argument("--interests", nargs="*", default=[], help="interests (free text)")
    rec.add_argument("--gemini", action="store_true", help="use Gemini embeddings for matching")
    rec.add_argument("--profile_id", default=None, help="intern profile id (enables progress-aware ranking)")
    rec.set_defaults(func=_cmd_recommend)

    lp = sub.add_parser("learning_path", help="get a learning path for a role")
    lp.add_argument("--role_id", required=True)
    lp.add_argument("--skills", nargs="*", default=[], help="confirmed skills")
    lp.add_argument("--interests", nargs="*", default=[], help="interests")
    lp.add_argument("--gemini", action="store_true", help="use Gemini embeddings")
    lp.add_argument("--llm", action="store_true", help="allow LLM rationale refinement")
    lp.add_argument("--profile_id", default=None, help="intern profile id (excludes done milestones)")
    lp.set_defaults(func=_cmd_learning_path)

    pg = sub.add_parser("progress", help="record and view progress")
    gsub = pg.add_subparsers(dest="gcmd", required=True)

    rec_p = gsub.add_parser("record")
    rec_p.add_argument("--profile_id", required=True)
    rec_p.add_argument("--role_id", required=True)
    rec_p.add_argument("--milestone", type=int, required=True)
    rec_p.set_defaults(func=_cmd_progress_record)

    hist = gsub.add_parser("history")
    hist.add_argument("--profile_id", required=True)
    hist.set_defaults(func=_cmd_progress_history)

    ps = sub.add_parser("profile", help="manage stored profiles")
    psub = ps.add_subparsers(dest="pcmd", required=True)

    save = psub.add_parser("save")
    save.add_argument("--id", required=True)
    save.add_argument("--skills", nargs="*", default=[])
    save.add_argument("--interests", nargs="*", default=[])
    save.set_defaults(func=_cmd_profile_save)

    get = psub.add_parser("get")
    get.add_argument("--id", required=True)
    get.set_defaults(func=_cmd_profile_get)

    delete = psub.add_parser("delete")
    delete.add_argument("--id", required=True)
    delete.set_defaults(func=_cmd_profile_delete)

    return parser.parse_args(argv)


def main(argv=None):
    args = _parse(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
