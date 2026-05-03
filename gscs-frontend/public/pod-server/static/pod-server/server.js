var express = require("express");
var app     = express();
app.use(express.json({ limit: "2mb" }));

var badges       = new Map();
var certificates = new Map();

// ── POST /badge ───────────────────────────────────────────────────────────────
app.post("/badge", function(req, res) {
  var b = req.body;
  if (b.score === undefined || !b.grade)
    return res.status(400).json({ error: "Missing fields" });
  var id = Math.random().toString(36).slice(2, 10);
  badges.set(id, {
    score: b.score, grade: b.grade, credits: b.credits,
    co2_saved_grams: b.co2_saved_grams, certification: b.certification,
    created_at: new Date().toISOString()
  });
  res.json({ id: id, badge_url: "/badge/" + id });
});

// ── GET /badge/:id ────────────────────────────────────────────────────────────
app.get("/badge/:id", function(req, res) {
  var d = badges.get(req.params.id);
  if (!d) return res.status(404).send("<h2>Badge not found.</h2>");
  var gc = { A:"#00e887", B:"#7bd4a0", C:"#f5c542", D:"#e05c5c" };
  var cc = { Platinum:"#e2e8f0", Gold:"#f5c542", Silver:"#b0b8c1", Bronze:"#cd7f32", None:"#e05c5c" };
  var col  = gc[d.grade]         || "#00e887";
  var ccol = cc[d.certification] || "#7bd4a0";
  var iss  = new Date(d.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
  res.setHeader("Content-Type", "text/html");
  res.send(
    "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>GSCS Badge</title>"
    +"<style>*{box-sizing:border-box;margin:0;padding:0}"
    +"body{background:#060e06;color:#c8e8c8;font-family:'JetBrains Mono',monospace;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}"
    +".c{max-width:420px;width:100%;background:#0a1a0a;border:1px solid "+col+"40;border-radius:16px;padding:36px}"
    +".h{display:flex;align-items:center;gap:12px;margin-bottom:28px}"
    +".t{font-size:18px;font-weight:700;color:#00e887}"
    +".s{font-size:11px;color:#4a7a4a;margin-top:3px;letter-spacing:1px}"
    +".g{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}"
    +".st{background:#060e06;border:1px solid #1a3a1a;border-radius:10px;padding:16px;text-align:center}"
    +".sv{font-size:28px;font-weight:700;color:"+col+"}"
    +".sl{font-size:9px;color:#4a7a4a;letter-spacing:2px;margin-top:4px}"
    +".cert{display:inline-flex;align-items:center;gap:8px;background:"+ccol+"18;border:1px solid "+ccol+"50;border-radius:20px;padding:6px 16px;margin-bottom:20px;font-size:12px;font-weight:700;color:"+ccol+";letter-spacing:1px}"
    +".f{font-size:10px;color:#2a5a2a;text-align:center;padding-top:16px;border-top:1px solid #1a3a1a}"
    +"</style></head><body><div class='c'>"
    +"<div class='h'><div style='font-size:32px'>&#127807;</div>"
    +"<div><div class='t'>Green Software Certified</div><div class='s'>GREEN SOFTWARE CREDIT SYSTEM</div></div></div>"
    +"<div class='cert'>&#10022; "+d.certification.toUpperCase()+" CERTIFICATION</div>"
    +"<div class='g'>"
    +"<div class='st'><div class='sv'>"+d.score+"</div><div class='sl'>SCORE</div></div>"
    +"<div class='st'><div class='sv'>"+d.grade+"</div><div class='sl'>GRADE</div></div>"
    +"<div class='st'><div class='sv'>+"+d.credits+"</div><div class='sl'>CREDITS</div></div>"
    +"<div class='st'><div class='sv' style='font-size:20px'>"+d.co2_saved_grams+"g</div><div class='sl'>CO2 SAVED</div></div>"
    +"</div><div class='f'>Issued "+iss+" &middot; Powered by BrowserPod</div>"
    +"</div></body></html>"
  );
});

// ── POST /certificate ─────────────────────────────────────────────────────────
app.post("/certificate", function(req, res) {
  var b = req.body;
  if (!b.summary) return res.status(400).json({ error: "Missing summary" });
  var id = Math.random().toString(36).slice(2, 10);
  certificates.set(id, {
    projectName: b.projectName || "Unnamed", summary: b.summary,
    top_issues: b.top_issues || [], files: b.files || [],
    created_at: new Date().toISOString()
  });
  res.json({ id: id, cert_url: "/certificate/" + id });
});

// ── GET /certificate/:id ──────────────────────────────────────────────────────
app.get("/certificate/:id", function(req, res) {
  var d = certificates.get(req.params.id);
  if (!d) return res.status(404).send("<h2>Certificate not found.</h2>");
  var cc   = { Platinum:"#e2e8f0", Gold:"#f5c542", Silver:"#b0b8c1", Bronze:"#cd7f32", None:"#e05c5c" };
  var gc   = { A:"#00e887", B:"#7bd4a0", C:"#f5c542", D:"#e05c5c" };
  var col  = cc[d.summary.certification] || "#b0b8c1";
  var gcol = gc[d.summary.grade]         || "#00e887";
  var iss  = new Date(d.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });
  var ir   = d.top_issues.map(function(i) {
    return "<tr><td>"+i.rule_id.replace(/_/g," ")+"</td><td style='text-align:right;color:"+gcol+";font-weight:700'>"+i.count+"</td></tr>";
  }).join("");
  var fr   = d.files.slice(0,25).map(function(f) {
    var c = gc[f.grade] || "#7bd4a0";
    return "<tr><td style='word-break:break-all'>"+f.path+"</td><td style='text-align:center;color:"+c+";font-weight:700'>"+(f.score||"-")+"</td><td style='text-align:center;color:"+c+";font-weight:700'>"+(f.grade||"-")+"</td><td style='text-align:center'>"+f.issues+"</td></tr>";
  }).join("");
  res.setHeader("Content-Type", "text/html");
  res.send(
    "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>GSCS Certificate</title>"
    +"<style>*{box-sizing:border-box;margin:0;padding:0}@media print{.np{display:none!important}}"
    +"body{background:#060e06;color:#c8e8c8;font-family:'JetBrains Mono',monospace;padding:32px 16px}"
    +".page{max-width:860px;margin:0 auto}"
    +".hdr{text-align:center;padding:40px 24px 32px;border:2px solid "+col+"60;border-radius:16px;background:#0a1a0a;margin-bottom:24px}"
    +".cl{display:inline-flex;align-items:center;gap:10px;background:"+col+"18;border:1px solid "+col+"60;border-radius:24px;padding:8px 24px;margin:14px 0;font-size:14px;font-weight:700;color:"+col+";letter-spacing:2px}"
    +".pn{font-size:28px;font-weight:700;color:#e0f0e0;margin-top:8px;word-break:break-word}"
    +".is{font-size:11px;color:#4a7a4a;margin-top:8px}"
    +".stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:24px}"
    +".stat{background:#0a1a0a;border:1px solid #1a3a1a;border-radius:12px;padding:20px;text-align:center}"
    +".sv{font-size:30px;font-weight:700;color:"+gcol+"}"
    +".sl{font-size:9px;color:#4a7a4a;letter-spacing:2px;margin-top:6px}"
    +".sec{background:#0a1a0a;border:1px solid #1a3a1a;border-radius:12px;padding:24px;margin-bottom:18px}"
    +"h3{font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#4a7a4a;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #1a3a1a}"
    +"table{width:100%;border-collapse:collapse;font-size:12px}"
    +"th{text-align:left;font-size:9px;letter-spacing:2px;color:#4a7a4a;padding:8px 10px;border-bottom:1px solid #1a3a1a}"
    +"td{padding:8px 10px;border-bottom:1px solid #0f2a0f;color:#c8e8c8}"
    +".pb{display:block;width:100%;padding:14px;background:"+col+"18;border:2px solid "+col+"50;border-radius:10px;color:"+col+";font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;margin-top:20px}"
    +".ft{text-align:center;font-size:10px;color:#2a4a2a;margin-top:24px;padding-top:14px;border-top:1px solid #1a3a1a;line-height:1.8}"
    +"</style></head><body><div class='page'>"
    +"<div class='hdr'><div style='font-size:52px'>&#127807;</div>"
    +"<div style='font-size:10px;color:#4a7a4a;letter-spacing:4px'>GREEN SOFTWARE CREDIT SYSTEM</div>"
    +"<div class='cl'>&#10022; "+d.summary.certification.toUpperCase()+" CERTIFICATION</div>"
    +"<div class='pn'>"+d.projectName+"</div>"
    +"<div class='is'>Issued "+iss+"</div></div>"
    +"<div class='stats'>"
    +"<div class='stat'><div class='sv'>"+d.summary.overall_score+"</div><div class='sl'>SCORE</div></div>"
    +"<div class='stat'><div class='sv' style='color:"+gcol+"'>"+d.summary.grade+"</div><div class='sl'>GRADE</div></div>"
    +"<div class='stat'><div class='sv'>+"+d.summary.credits+"</div><div class='sl'>CREDITS</div></div>"
    +"<div class='stat'><div class='sv'>"+d.summary.audited_files+"</div><div class='sl'>FILES AUDITED</div></div>"
    +"<div class='stat'><div class='sv' style='font-size:22px'>"+d.summary.co2_saved_grams+"g</div><div class='sl'>CO2 SAVED</div></div>"
    +"</div>"
    +"<div class='sec'><h3>Certification Note</h3><p style='font-size:13px;color:#a0c8a0;line-height:1.7'>"+d.summary.certification_note+"</p></div>"
    +(ir ? "<div class='sec'><h3>Top Issues</h3><table><thead><tr><th>Rule</th><th style='text-align:right'>Count</th></tr></thead><tbody>"+ir+"</tbody></table></div>" : "")
    +(fr ? "<div class='sec'><h3>Files ("+d.files.length+")</h3><table><thead><tr><th>Path</th><th style='text-align:center'>Score</th><th style='text-align:center'>Grade</th><th style='text-align:center'>Issues</th></tr></thead><tbody>"+fr+"</tbody></table></div>" : "")
    +"<button class='pb np' onclick='window.print()'>Print / Save as PDF</button>"
    +"<div class='ft'>Green Software Credit System &copy; 2026<br>Powered by <strong style='color:#7bd4a0'>BrowserPod</strong> &middot; AI in the Box Hackathon, University of Leeds</div>"
    +"</div></body></html>"
  );
});

// ── GET /health ───────────────────────────────────────────────────────────────
app.get("/health", function(_req, res) {
  res.json({ status: "ok", runtime: "browserpod" });
});

app.listen(3000, function() {
  console.log("[GSCS pod-server] listening on port 3000");
});
