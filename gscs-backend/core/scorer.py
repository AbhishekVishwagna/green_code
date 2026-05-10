"""
scorer.py — GSCS Carbon Scoring & Credit Engine
Converts a list of detected issues into a score, grade, green credits,
and an estimated CO2 saving using a simplified emission model.
"""

from dataclasses import dataclass
from typing import Optional
from .auditor import Issue


# ---------------------------------------------------------------------------
# Constants — emission model
# ---------------------------------------------------------------------------

# Average carbon intensity of global data centre electricity (gCO2/kWh)
# Source: IEA 2023 Global Average
GRID_INTENSITY_G_PER_KWH = 490.0

# Assumed average CPU TDP for a typical server core (Watts)
SERVER_CPU_WATTS = 15.0

# Assumed typical execution frequency: times this function/file runs per day
# (conservative estimate for a web service)
DAILY_EXECUTIONS = 10_000

# Seconds saved per inefficiency "unit" (very conservative model for demo)
SECONDS_SAVED_PER_UNIT = 0.001  # 1 ms

# Grade thresholds and credit awards
GRADE_TABLE = [
    (90, "A", 10, "#00e887"),
    (70, "B",  5, "#7bd4a0"),
    (50, "C",  2, "#f5c542"),
    ( 0, "D",  0, "#e05c5c"),
]

# Certification levels (used for project-level scanning)
CERT_LEVELS = [
    (90, "Platinum", "Exceptional green software — industry leading efficiency."),
    (75, "Gold",     "High-efficiency code with minimal carbon footprint."),
    (60, "Silver",   "Moderate efficiency. Targeted improvements recommended."),
    (40, "Bronze",   "Below average efficiency. Significant improvements needed."),
    ( 0, "None",     "Does not meet minimum green software standards."),
]


# ---------------------------------------------------------------------------
# Output types
# ---------------------------------------------------------------------------

@dataclass
class GradeResult:
    score: int                  # 0–100
    grade: str                  # A / B / C / D
    grade_color: str            # hex for UI
    credits: int                # green credits awarded
    label: str                  # "Excellent" / "Good" / ...
    issues_count: int
    high_count: int
    medium_count: int
    low_count: int
    co2_saved_grams: float      # estimated grams CO2 saved vs unoptimised
    co2_saved_per_day_kg: float # scaled to daily execution volume
    energy_saved_wh: float      # watt-hours saved per execution
    certification: str          # Platinum / Gold / Silver / Bronze / None
    certification_note: str


@dataclass
class ProjectScore:
    """Aggregated score across multiple files in a project."""
    total_files: int
    audited_files: int
    skipped_files: int           # parse errors
    overall_score: int
    grade: str
    grade_color: str
    credits: int
    certification: str
    certification_note: str
    co2_saved_grams: float
    co2_saved_per_day_kg: float
    files: list[dict]            # per-file breakdown
    top_issues: list[dict]       # most common issues across project


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_grade(score: int):
    for threshold, grade, credits, color in GRADE_TABLE:
        if score >= threshold:
            labels = {"A": "Excellent", "B": "Good", "C": "Fair", "D": "Poor"}
            return grade, credits, color, labels[grade]
    return "D", 0, "#e05c5c", "Poor"


def _get_certification(score: int):
    for threshold, cert, note in CERT_LEVELS:
        if score >= threshold:
            return cert, note
    return "None", "Does not meet minimum standards."


def _estimate_co2(issues: list[Issue]) -> tuple[float, float, float]:
    """
    Simplified CO2 model:
      1. Sum co2_weight per issue (each weight = grams saved per execution)
      2. Scale to daily executions for a practical impact number
      3. Back-calculate energy saved (Wh) from CO2 using grid intensity

    Returns (co2_per_exec_grams, co2_per_day_kg, energy_saved_wh)
    """
    co2_per_exec = sum(i.co2_weight for i in issues)

    # Energy saved per execution in Wh
    # co2_g = energy_wh * (GRID_INTENSITY_G_PER_KWH / 1000)
    energy_wh = co2_per_exec / (GRID_INTENSITY_G_PER_KWH / 1000)

    # Daily CO2 saving (kg)
    co2_per_day_kg = (co2_per_exec * DAILY_EXECUTIONS) / 1000

    return round(co2_per_exec, 3), round(co2_per_day_kg, 4), round(energy_wh, 6)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def score_issues(issues: list[Issue]) -> GradeResult:
    """
    Convert a list of Issue objects into a full GradeResult.

    Usage:
        from core.auditor import audit_code
        from core.scorer import score_issues

        result = audit_code(source)
        grade  = score_issues(result.issues)
        print(grade.score, grade.grade, grade.credits)
    """
    # Deduct penalties, floor at 0
    raw_score = 100 - sum(i.penalty for i in issues)
    score = max(0, min(100, raw_score))

    grade, credits, color, label = _get_grade(score)
    cert, cert_note = _get_certification(score)

    co2_g, co2_day_kg, energy_wh = _estimate_co2(issues)

    high   = sum(1 for i in issues if i.impact == "High")
    medium = sum(1 for i in issues if i.impact == "Medium")
    low    = sum(1 for i in issues if i.impact == "Low")

    return GradeResult(
        score=score,
        grade=grade,
        grade_color=color,
        credits=credits,
        label=label,
        issues_count=len(issues),
        high_count=high,
        medium_count=medium,
        low_count=low,
        co2_saved_grams=co2_g,
        co2_saved_per_day_kg=co2_day_kg,
        energy_saved_wh=energy_wh,
        certification=cert,
        certification_note=cert_note,
    )


def aggregate_project_scores(file_results: list[dict]) -> ProjectScore:
    """
    Roll up per-file GradeResult objects into a single project-level score.

    file_results: list of dicts with keys:
        path, grade_result (GradeResult), parse_error (str|None)
    """
    audited = [f for f in file_results if f.get("grade_result")]
    skipped = [f for f in file_results if f.get("parse_error")]

    if not audited:
        # Nothing auditable
        return ProjectScore(
            total_files=len(file_results),
            audited_files=0,
            skipped_files=len(skipped),
            overall_score=0,
            grade="D", grade_color="#e05c5c", credits=0,
            certification="None",
            certification_note="No auditable Python files found.",
            co2_saved_grams=0.0, co2_saved_per_day_kg=0.0,
            files=[], top_issues=[],
        )

    scores      = [f["grade_result"].score for f in audited]
    overall     = round(sum(scores) / len(scores))
    total_co2   = sum(f["grade_result"].co2_saved_grams for f in audited)
    total_co2d  = sum(f["grade_result"].co2_saved_per_day_kg for f in audited)
    total_cred  = sum(f["grade_result"].credits for f in audited)

    grade, _, color, _ = _get_grade(overall)
    cert, cert_note    = _get_certification(overall)

    # Count issue frequency across project
    issue_counter: dict[str, int] = {}
    for f in audited:
        gr: GradeResult = f["grade_result"]
        for issue in f.get("issues", []):
            issue_counter[issue.rule_id] = issue_counter.get(issue.rule_id, 0) + 1

    top_issues = sorted(
        [{"rule_id": k, "count": v} for k, v in issue_counter.items()],
        key=lambda x: x["count"], reverse=True
    )[:5]

    files_summary = [
        {
            "path":   f["path"],
            "score":  f["grade_result"].score,
            "grade":  f["grade_result"].grade,
            "issues": f["grade_result"].issues_count,
        }
        for f in audited
    ] + [
        {"path": f["path"], "score": None, "grade": None, "parse_error": f["parse_error"]}
        for f in skipped
    ]

    return ProjectScore(
        total_files=len(file_results),
        audited_files=len(audited),
        skipped_files=len(skipped),
        overall_score=overall,
        grade=grade,
        grade_color=color,
        credits=total_cred,
        certification=cert,
        certification_note=cert_note,
        co2_saved_grams=round(total_co2, 3),
        co2_saved_per_day_kg=round(total_co2d, 4),
        files=files_summary,
        top_issues=top_issues,
    )
