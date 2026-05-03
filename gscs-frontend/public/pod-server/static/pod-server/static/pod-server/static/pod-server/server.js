var express = require("express");
var path    = require("path");
var app     = express();
app.use(express.json({ limit: "2mb" }));

var badges       = new Map();
var certificates = new Map();

// ── Serve the built React app from /pod-server/static/ ───────────────────────
// This makes the portal URL load the full GSCS app (Audit, Scanner, Dashboard)
app.use(express.static(path.join(__dirname, "static")));

// ── API: POST /badge ──────────────────────────────────────────────────────────
app.post("/badge", function(req, res) {
  var body = req.body;
  if (body.score === undefined || !body.grade)
    return res.status(400).json({ error: "Missing required fields" });
  var id = Math.random().toString(36).slice(2, 10);
  badges.set(id, {
    score: body.score, grade: body.grade, credits: body.credits,
    co2_saved_grams: body.co2_saved_grams, certification: body.certification,
    created_at: new Date().toISOString()
  });
  res.json({ id: id, badge_url: "/badge/" + id });
});

// ── API: GET /badge/:id ───────────────────────────────────────────────────────
app.get("/badge/:id", function(req, res) {
  var data = badges.get(req.params.id);
  if (!data) return res.status(404).send("<h2>Badge not found or session expired.</h2>");

  var gradeColors = { A: "#00e887", B: "#7bd4a0", C: "#f5c542", D: "#e05c5c" };
  var certColors  = { Platinum: "#e2e8f0", Gold: "#f5c542", Silver: "#b0b8c1", Bronze: "#cd7f32", None: "#e05c5c" };
  var color     = gradeColors[data.grade]        || "#00e887";
  var certColor = certColors[data.certification] || "#7bd4a0";
  var issued    = new Date(data.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });

  res.setHeader("Content-Type", "text/html");
  res.send(
    "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>GSCS Badge</title>" +
    "<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#060e06;color:#c8e8c8;font-family:'JetBrains Mono',monospace;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}" +
    ".card{max-width:420px;width:100%;background:#0a1a0a;border:1px solid " + color + "40;border-radius:16px;padding:36px}" +
    ".header{display:flex;align-items:center;gap:12px;margin-bottom:28px}.title{font-size:18px;font-weight:700;color:#00e887}.subtitle{font-size:11px;color:#4a7a4a;margin-top:3px;letter-spacing:1px}" +
    ".grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}" +
    ".stat{background:#060e06;border:1px solid #1a3a1a;border-radius:10px;padding:16px;text-align:center}" +
    ".stat-val{font-size:28px;font-weight:700;color:" + color + "}.stat-label{font-size:9px;color:#4a7a4a;letter-spacing:2px;margin-top:4px}" +
    ".cert{display:inline-flex;align-items:center;gap:8px;background:" + certColor + "18;border:1px solid " + certColor + "50;border-radius:20px;padding:6px 16px;margin-bottom:20px;font-size:12px;font-weight:700;color:" + certColor + ";letter-spacing:1px}" +
    ".footer{font-size:10px;color:#2a5a2a;text-align:center;padding-top:16px;border-top:1px solid #1a3a1a}</style></head><body>" +
    "<div class='card'><div class='header'><div style='font-size:32px'>&#127807;</div>" +
    "<div><div class='title'>Green Software Certified</div><div class='subtitle'>GREEN SOFTWARE CREDIT SYSTEM</div></div></div>" +
    "<div class='cert'>&#10022; " + data.certification.toUpperCase() + " CERTIFICATION</div>" +
    "<div class='grid'><div class='stat'><div class='stat-val'>" + data.score + "</div><div class='stat-label'>SCORE</div></div>" +
    "<div class='stat'><div class='stat-val'>" + data.grade + "</div><div class='stat-label'>GRADE</div></div>" +
    "<div class='stat'><div class='stat-val'>+" + data.credits + "</div><div class='stat-label'>CREDITS</div></div>" +
    "<div class='stat'><div class='stat-val' style='font-size:20px'>" + data.co2_saved_grams + "g</div><div class='stat-label'>CO2 SAVED</div></div></div>" +
    "<div class='footer'>Issued " + issued + " &middot; Powered by BrowserPod</div></div></body></html>"
  );
});

// ── API: POST /certificate ────────────────────────────────────────────────────
app.post("/certificate", function(req, res) {
  var body = req.body;
  if (!body.summary) return res.status(400).json({ error: "Missing summary" });
  var id = Math.random().toString(36).slice(2, 10);
  certificates.set(id, {
    projectName: body.projectName || "Unnamed Project",
    summary: body.summary, top_issues: body.top_issues || [],
    files: body.files || [], created_at: new Date().toISOString()
  });
  res.json({ id: id, cert_url: "/certificate/" + id });
});

// ── API: GET /certificate/:id ─────────────────────────────────────────────────
app.get("/certificate/:id", function(req, res) {
  var data = certificates.get(req.params.id);
  if (!data) return res.status(404).send("<h2>Certificate not found or session expired.</h2>");

  var certColors  = { Platinum:"#e2e8f0", Gold:"#f5c542", Silver:"#b0b8c1", Bronze:"#cd7f32", None:"#e05c5c" };
  var gradeColors = { A:"#00e887", B:"#7bd4a0", C:"#f5c542", D:"#e05c5c" };
  var certColor  = certColors[data.summary.certification]  || "#b0b8c1";
  var gradeColor = gradeColors[data.summary.grade]         || "#00e887";
  var issued     = new Date(data.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });

  var issueRows = data.top_issues.map(function(i) {
    return "<tr><td>" + i.rule_id.replace(/_/g," ") + "</td><td style='text-align:right;color:" + gradeColor + ";font-weight:700'>" + i.count + "</td></tr>";
  }).join("");

  var fileRows = data.files.slice(0,25).map(function(f) {
    var col = gradeColors[f.grade] || "#7bd4a0";
    return "<tr><td style='word-break:break-all'>" + f.path + "</td><td style='text-align:center;color:" + col + ";font-weight:700'>" + (f.score||"-") + "</td><td style='text-align:center;color:" + col + ";font-weight:700'>" + (f.grade||"-") + "</td><td style='text-align:center'>" + f.issues + "</td></tr>";
  }).join("");

  res.setHeader("Content-Type", "text/html");
  res.send(
    "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>GSCS Certificate - " + data.projectName + "</title>" +
    "<style>*{box-sizing:border-box;margin:0;padding:0}@media print{.no-print{display:none!important}}" +
    "body{background:#060e06;color:#c8e8c8;font-family:'JetBrains Mono',monospace;padding:32px 16px;min-height:100vh}" +
    ".page{max-width:860px;margin:0 auto}" +
    ".header{text-align:center;padding:40px 24px 32px;border:2px solid " + certColor + "60;border-radius:16px;background:#0a1a0a;margin-bottom:24px}" +
    ".cert-level{display:inline-flex;align-items:center;gap:10px;background:" + certColor + "18;border:1px solid " + certColor + "60;border-radius:24px;padding:8px 24px;margin:14px 0;font-size:14px;font-weight:700;color:" + certColor + ";letter-spacing:2px}" +
    ".project-name{font-size:28px;font-weight:700;color:#e0f0e0;margin-top:8px}" +
    ".issued{font-size:11px;color:#4a7a4a;margin-top:8px}" +
    ".stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:24px}" +
    ".stat{background:#0a1a0a;border:1px solid #1a3a1a;border-radius:12px;padding:20px;text-align:center}" +
    ".stat-val{font-size:30px;font-weight:700;color:" + gradeColor + "}.stat-label{font-size:9px;color:#4a7a4a;letter-spacing:2px;margin-top:6px}" +
    ".section{background:#0a1a0a;border:1px solid #1a3a1a;border-radius:12px;padding:24px;margin-bottom:18px}" +
    "h3{font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#4a7a4a;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #1a3a1a}" +
    "table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;font-size:9px;letter-spacing:2px;color:#4a7a4a;padding:8px 10px;border-bottom:1px solid #1a3a1a}" +
    "td{padding:8px 10px;border-bottom:1px solid #0f2a0f;color:#c8e8c8}" +
    ".print-btn{display:block;width:100%;padding:14px;background:" + certColor + "18;border:2px solid " + certColor + "50;border-radius:10px;color:" + certColor + ";font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;margin-top:20px}" +
    ".footer{text-align:center;font-size:10px;color:#2a4a2a;margin-top:24px;padding-top:14px;border-top:1px solid #1a3a1a;line-height:1.8}</style></head><body>" +
    "<div class='page'><div class='header'><div style='font-size:52px'>&#127807;</div>" +
    "<div style='font-size:10px;color:#4a7a4a;letter-spacing:4px'>GREEN SOFTWARE CREDIT SYSTEM</div>" +
    "<div class='cert-level'>&#10022; " + data.summary.certification.toUpperCase() + " CERTIFICATION</div>" +
    "<div class='project-name'>" + data.projectName + "</div>" +
    "<div class='issued'>Certificate issued " + issued + "</div></div>" +
    "<div class='stats'>" +
    "<div class='stat'><div class='stat-val'>" + data.summary.overall_score + "</div><div class='stat-label'>OVERALL SCORE</div></div>" +
    "<div class='stat'><div class='stat-val' style='color:" + gradeColor + "'>" + data.summary.grade + "</div><div class='stat-label'>GRADE</div></div>" +
    "<div class='stat'><div class='stat-val'>+" + data.summary.credits + "</div><div class='stat-label'>CREDITS</div></div>" +
    "<div class='stat'><div class='stat-val'>" + data.summary.audited_files + "</div><div class='stat-label'>FILES AUDITED</div></div>" +
    "<div class='stat'><div class='stat-val' style='font-size:22px'>" + data.summary.co2_saved_grams + "g</div><div class='stat-label'>CO2 SAVED</div></div></div>" +
    "<div class='section'><h3>Certification Note</h3><p style='font-size:13px;color:#a0c8a0;line-height:1.7'>" + data.summary.certification_note + "</p></div>" +
    (data.top_issues.length > 0 ? "<div class='section'><h3>Top Recurring Issues</h3><table><thead><tr><th>Rule</th><th style='text-align:right'>Occurrences</th></tr></thead><tbody>" + issueRows + "</tbody></table></div>" : "") +
    (data.files.length > 0 ? "<div class='section'><h3>File-Level Results (" + data.files.length + " files)</h3><table><thead><tr><th>File Path</th><th style='text-align:center'>Score</th><th style='text-align:center'>Grade</th><th style='text-align:center'>Issues</th></tr></thead><tbody>" + fileRows + "</tbody></table></div>" : "") +
    "<button class='print-btn no-print' onclick='window.print()'>Print / Save as PDF</button>" +
    "<div class='footer'>Generated by <strong style='color:" + certColor + "'>Green Software Credit System</strong><br>Powered by <strong style='color:#7bd4a0'>BrowserPod</strong></div>" +
    "</div></body></html>"
  );
});

// ── GET /health ───────────────────────────────────────────────────────────────
app.get("/health", function(_req, res) {
  res.json({ status: "ok", runtime: "browserpod" });
});

// ── SPA fallback — send index.html for all unknown routes ─────────────────────
// Required so React Router handles /audit, /scan, /dashboard etc
app.get("*", function(_req, res) {
  res.sendFile(path.join(__dirname, "static", "index.html"));
});

app.listen(3000, function() {
  console.log("[GSCS pod-server] listening on port 3000");
});
