// api/server.js — GSCS HTTP API Server
// Bridges Lovable frontend <-> Python core engine
// Runs Python scripts via child_process for sandboxed execution

const express = require("express");
const cors    = require("cors");
const { execFile } = require("child_process");
const path    = require("path");
const fs      = require("fs");
const os      = require("os");
const crypto  = require("crypto");

const app  = express();
const PORT = process.env.PORT || 3001;

// Path to the Python interpreter (use venv if present)
const PYTHON = process.env.PYTHON_BIN
  || (fs.existsSync(".venv/bin/python") ? ".venv/bin/python" : "python3");

const CORE_DIR = path.join(__dirname, "..", "core");

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json({ limit: "2mb" }));

// ---------------------------------------------------------------------------
// Helper: run a Python snippet and return stdout as parsed JSON
// ---------------------------------------------------------------------------

function runPython(script, timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    execFile(
      PYTHON,
      ["-c", script],
      {
        timeout: timeoutMs,
        env: { ...process.env, PYTHONPATH: path.join(__dirname, "..") },
      },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(new Error(`Python returned non-JSON: ${stdout.slice(0, 200)}`));
        }
      }
    );
  });
}

// Escape code for safe embedding in a Python string
function escapePy(str) {
  return str.replace(/\\/g, "\\\\").replace(/"""/g, '\\"\\"\\"');
}

// ---------------------------------------------------------------------------
// POST /audit
// Body: { code: string }
// Returns: single-file audit result
// ---------------------------------------------------------------------------

app.post("/audit", async (req, res) => {
  const { code } = req.body;

  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Missing 'code' field" });
  }

  if (code.length > 100_000) {
    return res.status(400).json({ error: "Code exceeds 100KB limit" });
  }

  const script = `
import json, sys
sys.path.insert(0, '${CORE_DIR.replace(/\\/g, "\\\\")}/..')
from core.auditor import audit_code
from core.scorer import score_issues

source = """${escapePy(code)}"""
audit  = audit_code(source)

if audit.parse_error:
    print(json.dumps({"error": audit.parse_error}))
    sys.exit(0)

grade = score_issues(audit.issues)

result = {
    "score":    grade.score,
    "grade":    grade.grade,
    "label":    grade.label,
    "credits":  grade.credits,
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
print(json.dumps(result))
`;

  try {
    const result = await runPython(script);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /scan
// Body: { project_path: string, project_name?: string }
// Returns: project-level carbon rating + certification
// ---------------------------------------------------------------------------

app.post("/scan", async (req, res) => {
  const { project_path, project_name = "My Project" } = req.body;

  if (!project_path || typeof project_path !== "string") {
    return res.status(400).json({ error: "Missing 'project_path' field" });
  }

  // Security: resolve to absolute path and reject traversal attempts
  const resolved = path.resolve(project_path);
  const allowed  = [os.homedir(), "/tmp", process.env.SCAN_ALLOWED_ROOT].filter(Boolean);
  const isAllowed = allowed.some(a => resolved.startsWith(a));

  if (!isAllowed && process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Path not in allowed scan roots" });
  }

  if (!fs.existsSync(resolved)) {
    return res.status(404).json({ error: "Path does not exist" });
  }

  const script = `
import json, sys
sys.path.insert(0, '${CORE_DIR.replace(/\\/g, "\\\\")}/..')
from core.scanner import scan_project, project_to_dict

ps = scan_project(r"${resolved.replace(/\\/g, "\\\\")}", verbose=False)
print(json.dumps(project_to_dict(ps)))
`;

  try {
    const result = await runPython(script, 60_000);  // 60s timeout for large projects
    result.project_name = project_name;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /health
// ---------------------------------------------------------------------------

app.get("/health", (req, res) => {
  res.json({ status: "ok", python: PYTHON });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`\n  🌱 GSCS API running on http://localhost:${PORT}`);
  console.log(`  Python: ${PYTHON}\n`);
});

module.exports = app;
