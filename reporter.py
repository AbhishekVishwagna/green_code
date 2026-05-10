"""
reporter.py — GSCS Report & Certificate Generator
Turns a ProjectScore or single-file GradeResult into:
  - A structured JSON report  (machine-readable)
  - A self-contained HTML certificate  (human-readable, embeddable)
"""

import json
import hashlib
import datetime
from pathlib import Path
from .scorer import GradeResult, ProjectScore


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

CERT_COLORS = {
    "Platinum": "#e2e8f0",
    "Gold":     "#f5c542",
    "Silver":   "#b0b8c1",
    "Bronze":   "#cd7f32",
    "None":     "#e05c5c",
}

GRADE_COLORS = {
    "A": "#00e887",
    "B": "#7bd4a0",
    "C": "#f5c542",
    "D": "#e05c5c",
}


def _cert_id(content: str) -> str:
    """Deterministic short certificate ID based on report content."""
    return hashlib.sha256(content.encode()).hexdigest()[:12].upper()


def _now_iso() -> str:
    return datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _now_display() -> str:
    return datetime.datetime.utcnow().strftime("%d %b %Y")


# ---------------------------------------------------------------------------
# JSON report
# ---------------------------------------------------------------------------

def generate_json_report(
    result: GradeResult | ProjectScore,
    project_name: str = "Unnamed Project",
    output_path: str | Path | None = None,
) -> dict:
    """
    Generate a structured JSON report dict.
    Optionally write it to a file.

    Usage:
        report = generate_json_report(grade_result, project_name="MyApp")
        print(json.dumps(report, indent=2))
    """
    is_project = isinstance(result, ProjectScore)
    timestamp = _now_iso()

    if is_project:
        body = {
            "type":          "project",
            "project":       project_name,
            "generated_at":  timestamp,
            "summary": {
                "overall_score":        result.overall_score,
                "grade":                result.grade,
                "credits":              result.credits,
                "certification":        result.certification,
                "certification_note":   result.certification_note,
                "total_files":          result.total_files,
                "audited_files":        result.audited_files,
                "skipped_files":        result.skipped_files,
                "co2_saved_grams":      result.co2_saved_grams,
                "co2_saved_per_day_kg": result.co2_saved_per_day_kg,
            },
            "top_issues": result.top_issues,
            "files":      result.files,
        }
    else:
        body = {
            "type":         "file",
            "project":      project_name,
            "generated_at": timestamp,
            "summary": {
                "score":                result.score,
                "grade":                result.grade,
                "label":                result.label,
                "credits":              result.credits,
                "certification":        result.certification,
                "certification_note":   result.certification_note,
                "issues_count":         result.issues_count,
                "high_count":           result.high_count,
                "medium_count":         result.medium_count,
                "low_count":            result.low_count,
                "co2_saved_grams":      result.co2_saved_grams,
                "co2_saved_per_day_kg": result.co2_saved_per_day_kg,
                "energy_saved_wh":      result.energy_saved_wh,
            },
        }

    if output_path:
        Path(output_path).write_text(json.dumps(body, indent=2))

    return body


# ---------------------------------------------------------------------------
# HTML Certificate
# ---------------------------------------------------------------------------

def generate_html_certificate(
    result: GradeResult | ProjectScore,
    project_name: str = "Unnamed Project",
    output_path: str | Path | None = None,
) -> str:
    """
    Generate a self-contained HTML certificate page.
    Returns the HTML string; optionally writes to a file.

    Usage:
        html = generate_html_certificate(project_score, "MyDjangoApp")
        Path("./output/certificate.html").write_text(html)
    """
    is_project = isinstance(result, ProjectScore)

    score = result.overall_score if is_project else result.score
    grade = result.grade
    cert  = result.certification
    credits = result.credits
    co2_g = result.co2_saved_grams
    co2_day = result.co2_saved_per_day_kg
    note  = result.certification_note

    cert_color  = CERT_COLORS.get(cert, "#e05c5c")
    grade_color = GRADE_COLORS.get(grade, "#e05c5c")
    cert_id     = _cert_id(f"{project_name}{score}{grade}{cert}")
    date_str    = _now_display()

    files_section = ""
    if is_project:
        rows = "".join(
            f"""<tr>
              <td style="padding:8px 12px;border-bottom:1px solid #1a3a1a;font-size:12px;
                         font-family:monospace;color:#c8e8c8">{f['path']}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #1a3a1a;text-align:center;
                         color:{GRADE_COLORS.get(f.get('grade','D'),'#e05c5c')};font-weight:700">
                  {f.get('score','—')}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #1a3a1a;text-align:center;
                         color:{GRADE_COLORS.get(f.get('grade','D'),'#e05c5c')};font-weight:700">
                  {f.get('grade','ERR')}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #1a3a1a;text-align:center;
                         color:#6b9b6b;font-size:12px">
                  {f.get('issues',f.get('parse_error','—'))}</td>
            </tr>"""
            for f in result.files
        )
        files_section = f"""
        <div style="margin-top:40px">
          <h3 style="color:#4a7a4a;font-size:13px;letter-spacing:2px;margin-bottom:16px">
            FILE BREAKDOWN
          </h3>
          <table style="width:100%;border-collapse:collapse;background:#0a1a0a;
                        border:1px solid #1a3a1a;border-radius:8px;overflow:hidden">
            <thead>
              <tr style="background:#0d200d">
                <th style="padding:10px 12px;text-align:left;color:#4a7a4a;
                           font-size:11px;letter-spacing:1px;font-weight:500">FILE</th>
                <th style="padding:10px 12px;color:#4a7a4a;font-size:11px;letter-spacing:1px;font-weight:500">SCORE</th>
                <th style="padding:10px 12px;color:#4a7a4a;font-size:11px;letter-spacing:1px;font-weight:500">GRADE</th>
                <th style="padding:10px 12px;color:#4a7a4a;font-size:11px;letter-spacing:1px;font-weight:500">ISSUES</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GSCS Certificate — {project_name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: #060e06;
      color: #c8e8c8;
      font-family: 'JetBrains Mono', monospace;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 48px 24px;
    }}
    .cert {{
      max-width: 680px;
      width: 100%;
      border: 1px solid {grade_color}40;
      border-radius: 20px;
      padding: 48px;
      background: #0a1a0a;
      position: relative;
    }}
    .cert::before {{
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 20px;
      border: 1px solid {cert_color}20;
      pointer-events: none;
    }}
    .badge {{
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: {cert_color}18;
      border: 1px solid {cert_color}50;
      border-radius: 40px;
      padding: 8px 20px;
      margin-bottom: 36px;
    }}
    .dot {{ width:8px;height:8px;border-radius:50%;background:{cert_color}; }}
    .stat {{ text-align:center;padding:20px; }}
    .stat-val {{ font-size:36px;font-weight:700;color:{grade_color}; }}
    .stat-label {{ font-size:10px;color:#4a7a4a;letter-spacing:2px;margin-top:6px; }}
    .divider {{ border:none;border-top:1px solid #1a3a1a;margin:28px 0; }}
    @media print {{ body {{ background:white;color:#333; }} .cert {{ border-color:#ccc; }} }}
  </style>
</head>
<body>
  <div class="cert">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:36px">
      <div>
        <div style="color:#2a5a2a;font-size:11px;letter-spacing:3px;margin-bottom:8px">
          GREEN SOFTWARE CREDIT SYSTEM
        </div>
        <div style="font-size:22px;font-weight:700;color:#00e887">
          Carbon Efficiency Certificate
        </div>
      </div>
      <div style="font-size:32px">🌱</div>
    </div>

    <!-- Certification badge -->
    <div class="badge">
      <div class="dot"></div>
      <span style="color:{cert_color};font-weight:700;font-size:14px;letter-spacing:1px">
        {cert.upper()} CERTIFICATION
      </span>
    </div>

    <!-- Project name -->
    <div style="margin-bottom:32px">
      <div style="color:#2a5a2a;font-size:11px;letter-spacing:2px;margin-bottom:8px">PROJECT</div>
      <div style="font-size:20px;font-weight:700">{project_name}</div>
      <div style="color:#4a7a4a;font-size:13px;margin-top:4px">{note}</div>
    </div>

    <hr class="divider">

    <!-- Score grid -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;
                background:#1a3a1a;border:1px solid #1a3a1a;border-radius:12px;
                overflow:hidden;margin-bottom:28px">
      <div class="stat" style="background:#0a1a0a">
        <div class="stat-val">{score}</div>
        <div class="stat-label">SCORE</div>
      </div>
      <div class="stat" style="background:#0a1a0a">
        <div class="stat-val">{grade}</div>
        <div class="stat-label">GRADE</div>
      </div>
      <div class="stat" style="background:#0a1a0a">
        <div class="stat-val">+{credits}</div>
        <div class="stat-label">CREDITS</div>
      </div>
      <div class="stat" style="background:#0a1a0a">
        <div class="stat-val" style="font-size:24px">{co2_g}g</div>
        <div class="stat-label">CO₂ SAVED</div>
      </div>
    </div>

    <!-- CO2 callout -->
    <div style="background:#060e06;border:1px solid #1a3a1a;border-radius:10px;
                padding:16px 20px;margin-bottom:28px;display:flex;
                align-items:center;justify-content:space-between">
      <div>
        <div style="color:#4a7a4a;font-size:11px;letter-spacing:2px;margin-bottom:4px">
          PROJECTED DAILY CO₂ SAVING
        </div>
        <div style="color:{grade_color};font-size:18px;font-weight:700">
          {co2_day} kg CO₂e / day
        </div>
        <div style="color:#2a5a2a;font-size:11px;margin-top:4px">
          Based on 10,000 daily executions @ 490 gCO₂/kWh (IEA 2023)
        </div>
      </div>
    </div>

    {files_section}

    <hr class="divider">

    <!-- Footer -->
    <div style="display:flex;justify-content:space-between;align-items:flex-end">
      <div>
        <div style="color:#2a5a2a;font-size:10px;letter-spacing:2px;margin-bottom:4px">
          CERTIFICATE ID
        </div>
        <div style="font-size:13px;color:#4a7a4a">GSCS-{cert_id}</div>
      </div>
      <div style="text-align:right">
        <div style="color:#2a5a2a;font-size:10px;letter-spacing:2px;margin-bottom:4px">ISSUED</div>
        <div style="font-size:13px;color:#4a7a4a">{date_str}</div>
      </div>
    </div>
  </div>
</body>
</html>"""

    if output_path:
        Path(output_path).write_text(html, encoding="utf-8")

    return html
