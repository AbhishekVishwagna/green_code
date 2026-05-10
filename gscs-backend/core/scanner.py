"""
scanner.py — GSCS Project-Level Scanner
Walks an entire project directory, audits every Python file,
and produces an aggregated carbon rating + certification.

This is the engine behind:
  - The CLI pre-deploy check (gscs scan ./src)
  - The POST /scan API endpoint
"""

import os
import json
import time
from pathlib import Path
from dataclasses import asdict
from .auditor import audit_code
from .scorer import score_issues, aggregate_project_scores, ProjectScore


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# File extensions to audit
SUPPORTED_EXTENSIONS = {".py"}

# Directories to always skip (common non-production paths)
SKIP_DIRS = {
    ".git", ".hg", ".svn",
    "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache",
    "node_modules", ".venv", "venv", "env", ".env",
    "dist", "build", "eggs", ".eggs", "*.egg-info",
    "migrations",       # Django DB migrations — not application logic
    "alembic",          # SQLAlchemy migration scripts
}

# Files to always skip
SKIP_FILES = {
    "setup.py", "setup.cfg", "conftest.py",
    "manage.py",  # Django management
}

# Maximum file size to audit (bytes) — prevents hanging on generated files
MAX_FILE_BYTES = 500_000  # 500 KB


# ---------------------------------------------------------------------------
# Scanner
# ---------------------------------------------------------------------------

def _should_skip_dir(dirname: str) -> bool:
    return dirname in SKIP_DIRS or dirname.startswith(".")


def _should_skip_file(filepath: Path) -> bool:
    if filepath.name in SKIP_FILES:
        return True
    if filepath.suffix not in SUPPORTED_EXTENSIONS:
        return True
    if filepath.stat().st_size > MAX_FILE_BYTES:
        return True
    return False


def scan_project(
    root: str | Path,
    max_files: int = 500,
    verbose: bool = False,
) -> ProjectScore:
    """
    Walk a project directory and return a ProjectScore.

    Args:
        root:       Path to the project root (or any sub-directory)
        max_files:  Safety limit — won't audit more than this many files
        verbose:    Print progress to stdout

    Returns:
        ProjectScore — the aggregated carbon rating for the whole project

    Usage:
        result = scan_project("./my_django_project")
        print(result.certification, result.overall_score)
    """
    root = Path(root).resolve()

    if not root.exists():
        raise FileNotFoundError(f"Path does not exist: {root}")
    if not root.is_dir():
        raise NotADirectoryError(f"Expected a directory: {root}")

    file_results = []
    files_found = 0
    start = time.monotonic()

    for dirpath, dirnames, filenames in os.walk(root, topdown=True):
        # Prune skipped directories in-place (stops os.walk from descending)
        dirnames[:] = [d for d in dirnames if not _should_skip_dir(d)]

        for filename in filenames:
            filepath = Path(dirpath) / filename

            try:
                if _should_skip_file(filepath):
                    continue
            except OSError:
                continue

            files_found += 1
            if files_found > max_files:
                if verbose:
                    print(f"  [!] Max file limit ({max_files}) reached — stopping early")
                break

            rel_path = str(filepath.relative_to(root))

            if verbose:
                print(f"  → auditing {rel_path}")

            try:
                source = filepath.read_text(encoding="utf-8", errors="replace")
            except OSError as e:
                file_results.append({
                    "path": rel_path,
                    "grade_result": None,
                    "issues": [],
                    "parse_error": f"Could not read file: {e}",
                })
                continue

            audit = audit_code(source)

            if audit.parse_error:
                file_results.append({
                    "path": rel_path,
                    "grade_result": None,
                    "issues": [],
                    "parse_error": audit.parse_error,
                })
                continue

            grade = score_issues(audit.issues)
            file_results.append({
                "path":         rel_path,
                "grade_result": grade,
                "issues":       audit.issues,
                "parse_error":  None,
            })

    elapsed = round(time.monotonic() - start, 2)

    if verbose:
        print(f"\n  Scanned {files_found} files in {elapsed}s")

    project = aggregate_project_scores(file_results)
    return project


def scan_single_file(filepath: str | Path) -> dict:
    """
    Audit a single file and return a dict suitable for the API response.

    Usage:
        result = scan_single_file("./app/utils.py")
    """
    filepath = Path(filepath).resolve()
    source = filepath.read_text(encoding="utf-8", errors="replace")
    audit  = audit_code(source)

    if audit.parse_error:
        return {"error": audit.parse_error}

    grade = score_issues(audit.issues)

    return {
        "file":    str(filepath),
        "score":   grade.score,
        "grade":   grade.grade,
        "credits": grade.credits,
        "certification": grade.certification,
        "co2_saved_grams":      grade.co2_saved_grams,
        "co2_saved_per_day_kg": grade.co2_saved_per_day_kg,
        "issues": [
            {
                "rule_id":    i.rule_id,
                "issue":      i.issue,
                "impact":     i.impact,
                "penalty":    i.penalty,
                "line":       i.line,
                "suggestion": i.suggestion,
            }
            for i in audit.issues
        ],
    }


def project_to_dict(ps: ProjectScore) -> dict:
    """Serialise a ProjectScore to a plain dict (JSON-safe)."""
    return {
        "summary": {
            "total_files":          ps.total_files,
            "audited_files":        ps.audited_files,
            "skipped_files":        ps.skipped_files,
            "overall_score":        ps.overall_score,
            "grade":                ps.grade,
            "credits":              ps.credits,
            "certification":        ps.certification,
            "certification_note":   ps.certification_note,
            "co2_saved_grams":      ps.co2_saved_grams,
            "co2_saved_per_day_kg": ps.co2_saved_per_day_kg,
        },
        "top_issues": ps.top_issues,
        "files":      ps.files,
    }
