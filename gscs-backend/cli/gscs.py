#!/usr/bin/env python3
"""
cli/gscs.py — GSCS Command-Line Interface
Pre-deployment project carbon scanner.

Usage:
    python cli/gscs.py scan ./my_project
    python cli/gscs.py scan ./src --output ./reports
    python cli/gscs.py scan ./src --fail-below 70
    python cli/gscs.py file ./app/utils.py

Exit codes:
    0 — passed (score >= threshold)
    1 — failed  (score < threshold, use in CI/CD pipelines)
    2 — error   (bad path, no Python files found, etc.)
"""

import sys
import json
import argparse
from pathlib import Path

# Allow running from repo root: python cli/gscs.py
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.scanner import scan_project, scan_single_file, project_to_dict
from core.reporter import generate_json_report, generate_html_certificate
from core.scorer import GradeResult


# ---------------------------------------------------------------------------
# ANSI colours (disable on Windows if needed)
# ---------------------------------------------------------------------------

GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RESET  = "\033[0m"

CERT_BADGE = {
    "Platinum": f"{CYAN}✦ PLATINUM{RESET}",
    "Gold":     f"{YELLOW}★ GOLD{RESET}",
    "Silver":   f"{DIM}◆ SILVER{RESET}",
    "Bronze":   f"\033[33m◇ BRONZE{RESET}",
    "None":     f"{RED}✗ NOT CERTIFIED{RESET}",
}

GRADE_COLOR = {
    "A": GREEN, "B": GREEN, "C": YELLOW, "D": RED
}


def _grade_str(grade: str, score: int) -> str:
    c = GRADE_COLOR.get(grade, "")
    return f"{c}{BOLD}Grade {grade} ({score}/100){RESET}"


def _bar(score: int, width: int = 30) -> str:
    filled = round(score / 100 * width)
    empty  = width - filled
    color  = GREEN if score >= 70 else YELLOW if score >= 50 else RED
    return f"{color}{'█' * filled}{DIM}{'░' * empty}{RESET}"


def _print_header():
    print(f"\n{GREEN}{BOLD}")
    print("  ╔══════════════════════════════════════╗")
    print("  ║   🌱 Green Software Credit System    ║")
    print("  ╚══════════════════════════════════════╝")
    print(f"{RESET}")


# ---------------------------------------------------------------------------
# Subcommand: scan (whole project)
# ---------------------------------------------------------------------------

def cmd_scan(args):
    root = Path(args.path)

    if not root.exists():
        print(f"{RED}Error: path not found — {root}{RESET}", file=sys.stderr)
        return 2

    _print_header()
    print(f"  Scanning {BOLD}{root.resolve()}{RESET}\n")

    project = scan_project(root, verbose=args.verbose)

    # ---- Print summary ----
    score = project.overall_score
    print(f"  {_bar(score)}")
    print(f"  {_grade_str(project.grade, score)}")
    print(f"  Certification : {CERT_BADGE.get(project.certification, project.certification)}")
    print(f"  {project.certification_note}\n")

    print(f"  {DIM}Files audited  : {project.audited_files}/{project.total_files}{RESET}")
    print(f"  {DIM}Files skipped  : {project.skipped_files}{RESET}")
    print(f"  {DIM}Green credits  : +{project.credits}{RESET}")
    print(f"  {DIM}CO₂ saved      : {project.co2_saved_grams}g per execution{RESET}")
    print(f"  {DIM}               : {project.co2_saved_per_day_kg} kg/day (est.){RESET}\n")

    # ---- Top issues ----
    if project.top_issues:
        print(f"  {BOLD}Top issues across project:{RESET}")
        for item in project.top_issues[:5]:
            print(f"  {DIM}·{RESET} {item['rule_id']:30s}  ×{item['count']}")
        print()

    # ---- Per-file breakdown ----
    if args.verbose:
        print(f"  {BOLD}File scores:{RESET}")
        for f in sorted(project.files, key=lambda x: (x.get("score") or 0)):
            s = f.get("score")
            g = f.get("grade", "?")
            if s is None:
                print(f"  {RED}✗{RESET}  {f['path']}  {DIM}(parse error){RESET}")
            else:
                c = GRADE_COLOR.get(g, "")
                print(f"  {c}{g}{RESET}  {f['path']}  {DIM}({s}/100){RESET}")
        print()

    # ---- Output files ----
    if args.output:
        out = Path(args.output)
        out.mkdir(parents=True, exist_ok=True)

        json_path = out / "gscs-report.json"
        generate_json_report(project, project_name=args.name, output_path=json_path)
        print(f"  {GREEN}✓{RESET} JSON report   → {json_path}")

        html_path = out / "gscs-certificate.html"
        generate_html_certificate(project, project_name=args.name, output_path=html_path)
        print(f"  {GREEN}✓{RESET} HTML cert     → {html_path}\n")

    # ---- Exit code for CI/CD ----
    threshold = args.fail_below
    if threshold and score < threshold:
        print(f"  {RED}{BOLD}✗ FAILED — score {score} is below threshold {threshold}{RESET}\n")
        return 1

    print(f"  {GREEN}{BOLD}✓ PASSED{RESET}\n")
    return 0


# ---------------------------------------------------------------------------
# Subcommand: file (single file)
# ---------------------------------------------------------------------------

def cmd_file(args):
    fp = Path(args.path)

    if not fp.exists():
        print(f"{RED}Error: file not found — {fp}{RESET}", file=sys.stderr)
        return 2

    _print_header()
    print(f"  Auditing {BOLD}{fp.resolve()}{RESET}\n")

    result = scan_single_file(fp)

    if "error" in result:
        print(f"  {RED}Parse error: {result['error']}{RESET}", file=sys.stderr)
        return 2

    score = result["score"]
    grade = result["grade"]
    print(f"  {_bar(score)}")
    print(f"  {_grade_str(grade, score)}")
    print(f"  Certification : {CERT_BADGE.get(result['certification'], result['certification'])}\n")
    print(f"  {DIM}Green credits  : +{result['credits']}{RESET}")
    print(f"  {DIM}CO₂ saved      : {result['co2_saved_grams']}g{RESET}\n")

    if result["issues"]:
        print(f"  {BOLD}Issues found ({len(result['issues'])}):{RESET}")
        for issue in result["issues"]:
            impact_color = RED if issue["impact"] == "High" else YELLOW if issue["impact"] == "Medium" else DIM
            line_str = f"line {issue['line']}" if issue["line"] else "—"
            print(f"  {impact_color}[{issue['impact'][:3]}]{RESET}  "
                  f"{issue['issue']:<45}  {DIM}{line_str}{RESET}")
        print()

    if args.output:
        out = Path(args.output)
        out.mkdir(parents=True, exist_ok=True)
        json_path = out / f"{fp.stem}-gscs.json"
        json_path.write_text(json.dumps(result, indent=2))
        print(f"  {GREEN}✓{RESET} Saved → {json_path}\n")

    return 0


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="gscs",
        description="Green Software Credit System — carbon efficiency auditor",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # gscs scan <path>
    p_scan = sub.add_parser("scan", help="Scan an entire project directory")
    p_scan.add_argument("path",         help="Path to project root")
    p_scan.add_argument("--name",       default="My Project", help="Project display name")
    p_scan.add_argument("--output",     default=None, help="Directory for report output")
    p_scan.add_argument("--fail-below", type=int, default=None,
                        dest="fail_below",
                        help="Exit with code 1 if score is below this threshold (for CI/CD)")
    p_scan.add_argument("--verbose", "-v", action="store_true",
                        help="Show per-file scores and audit progress")

    # gscs file <path>
    p_file = sub.add_parser("file", help="Audit a single Python file")
    p_file.add_argument("path",   help="Path to .py file")
    p_file.add_argument("--output", default=None, help="Directory for JSON output")

    return parser


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = build_parser()
    args   = parser.parse_args()

    if args.command == "scan":
        code = cmd_scan(args)
    elif args.command == "file":
        code = cmd_file(args)
    else:
        parser.print_help()
        code = 2

    sys.exit(code)


if __name__ == "__main__":
    main()
