import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import PageWrapper from "@/components/PageWrapper";
import ScoreDial from "@/components/ScoreDial";
import GradeBadge from "@/components/GradeBadge";
import CertBanner from "@/components/CertBanner";
import AnimatedNumber from "@/components/AnimatedNumber";
import ScanningAnimation from "@/components/ScanningAnimation";
import { scanProject, createCertificate } from "@/lib/api";
import type { ScanResult } from "@/lib/types";

const gradeBarColor = (score: number | null) => {
  if (score === null) return "#4a7a4a";
  if (score >= 80) return "#00e887";
  if (score >= 60) return "#7bd4a0";
  if (score >= 40) return "#f5c542";
  return "#e05c5c";
};

// ── Local certificate (instant, no server needed) ─────────────────────────────
function buildLocalCertificateHtml(result: ScanResult, projectName: string): string {
  const { summary, top_issues, files } = result;
  const certColors: Record<string, string> = {
    Platinum: "#e2e8f0", Gold: "#f5c542", Silver: "#b0b8c1", Bronze: "#cd7f32", None: "#e05c5c",
  };
  const gradeColors: Record<string, string> = {
    A: "#00e887", B: "#7bd4a0", C: "#f5c542", D: "#e05c5c",
  };
  const certColor  = certColors[summary.certification]  ?? "#b0b8c1";
  const gradeColor = gradeColors[summary.grade]         ?? "#00e887";
  const issued = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const issueRows = top_issues.map(i =>
    `<tr><td>${i.rule_id.replace(/_/g, " ")}</td>
     <td style="text-align:right;color:${gradeColor};font-weight:700">${i.count}</td></tr>`
  ).join("");

  const fileRows = files.slice(0, 25).map(f => {
    const sc  = f.score ?? "—";
    const gc  = f.grade ?? "—";
    const col = gradeColors[gc as string] ?? "#7bd4a0";
    return `<tr>
      <td style="word-break:break-all">${f.path}</td>
      <td style="text-align:center;color:${col};font-weight:700">${sc}</td>
      <td style="text-align:center;color:${col};font-weight:700">${gc}</td>
      <td style="text-align:center">${f.issues}</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Green Code Certificate - ${projectName}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    @media print{.no-print{display:none!important}}
    body{background:#060e06;color:#c8e8c8;font-family:'JetBrains Mono','Courier New',monospace;padding:32px 16px;min-height:100vh}
    .page{max-width:860px;margin:0 auto}
    .header{text-align:center;padding:40px 24px 32px;border:2px solid ${certColor}60;border-radius:16px;background:#0a1a0a;margin-bottom:24px;position:relative;overflow:hidden}
    .header::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,${certColor}15,transparent 65%);pointer-events:none}
    .logo{font-size:52px;margin-bottom:10px}
    .brand{font-size:10px;color:#4a7a4a;letter-spacing:4px;margin-bottom:4px}
    .cert-level{display:inline-flex;align-items:center;gap:10px;background:${certColor}18;border:1px solid ${certColor}60;border-radius:24px;padding:8px 24px;margin:14px 0;font-size:14px;font-weight:700;color:${certColor};letter-spacing:2px}
    .project-name{font-size:28px;font-weight:700;color:#e0f0e0;margin-top:8px;word-break:break-word}
    .issued{font-size:11px;color:#4a7a4a;margin-top:8px;letter-spacing:1px}
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:24px}
    .stat{background:#0a1a0a;border:1px solid #1a3a1a;border-radius:12px;padding:20px;text-align:center}
    .stat-val{font-size:30px;font-weight:700;color:${gradeColor}}
    .stat-label{font-size:9px;color:#4a7a4a;letter-spacing:2px;margin-top:6px}
    .section{background:#0a1a0a;border:1px solid #1a3a1a;border-radius:12px;padding:24px;margin-bottom:18px}
    h3{font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#4a7a4a;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #1a3a1a}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{text-align:left;font-size:9px;letter-spacing:2px;color:#4a7a4a;padding:8px 10px;border-bottom:1px solid #1a3a1a}
    td{padding:8px 10px;border-bottom:1px solid #0f2a0f;color:#c8e8c8}
    .print-btn{display:block;width:100%;padding:14px;background:${certColor}18;border:2px solid ${certColor}50;border-radius:10px;color:${certColor};font-family:inherit;font-size:13px;font-weight:700;letter-spacing:2px;cursor:pointer;margin-top:20px}
    .print-btn:hover{background:${certColor}28}
    .footer{text-align:center;font-size:10px;color:#2a4a2a;margin-top:24px;padding-top:14px;border-top:1px solid #1a3a1a;line-height:1.8}
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo">🌱</div>
    <div class="brand">GREEN CODE</div>
    <div class="cert-level">✦ ${summary.certification.toUpperCase()} CERTIFICATION</div>
    <div class="project-name">${projectName}</div>
    <div class="issued">Certificate issued ${issued}</div>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-val">${summary.overall_score}</div><div class="stat-label">OVERALL SCORE</div></div>
    <div class="stat"><div class="stat-val" style="color:${gradeColor}">${summary.grade}</div><div class="stat-label">GRADE</div></div>
    <div class="stat"><div class="stat-val">+${summary.credits}</div><div class="stat-label">CREDITS</div></div>
    <div class="stat"><div class="stat-val">${summary.audited_files}</div><div class="stat-label">FILES AUDITED</div></div>
    <div class="stat"><div class="stat-val" style="font-size:22px">${summary.co2_saved_grams}g</div><div class="stat-label">CO₂ SAVED</div></div>
  </div>

  <div class="section">
    <h3>Certification Note</h3>
    <p style="font-size:13px;color:#a0c8a0;line-height:1.7">${summary.certification_note}</p>
  </div>

  ${top_issues.length > 0 ? `
  <div class="section">
    <h3>Top Recurring Issues</h3>
    <table>
      <thead><tr><th>Rule</th><th style="text-align:right">Occurrences</th></tr></thead>
      <tbody>${issueRows}</tbody>
    </table>
  </div>` : ""}

  ${files.length > 0 ? `
  <div class="section">
    <h3>File-Level Results (${files.length} files)</h3>
    <table>
      <thead><tr>
        <th>File Path</th>
        <th style="text-align:center">Score</th>
        <th style="text-align:center">Grade</th>
        <th style="text-align:center">Issues</th>
      </tr></thead>
      <tbody>${fileRows}</tbody>
    </table>
    ${files.length > 25 ? `<p style="font-size:10px;color:#4a7a4a;margin-top:10px">... and ${files.length - 25} more files</p>` : ""}
  </div>` : ""}

  <button class="print-btn no-print" onclick="window.print()">⬇ Print / Save as PDF</button>

  <div class="footer">
    Generated by <strong style="color:${certColor}">Green Code</strong><br>
    Powered by <strong style="color:#7bd4a0">BrowserPod</strong> — in-browser WebAssembly execution<br>
    <span style="color:#1a3a1a">greencode.dev</span>
  </div>
</div>
</body>
</html>`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Scan() {
  const [name, setName] = useState("my-project");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [fileCount, setFileCount] = useState(0);

  // Certificate state
  const [certOpened, setCertOpened] = useState(false);
  const [certBlobUrl, setCertBlobUrl] = useState<string | null>(null);
  const [podUrl, setPodUrl] = useState<string | null>(null);
  const [podUpgrading, setPodUpgrading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const pyFiles = Array.from(files).filter((f) => f.name.endsWith(".py"));
    setSelectedFiles(files);
    setFileCount(pyFiles.length);
    setResult(null);
    setCertOpened(false);
    setCertBlobUrl(null);
    setPodUrl(null);
    setError(null);
    const firstPath = (files[0] as File & { webkitRelativePath?: string }).webkitRelativePath;
    if (firstPath) {
      const parts = firstPath.split("/");
      if (parts.length > 1) setName(parts[0]);
    }
  };

  const run = async () => {
    if (!selectedFiles) { setError("Please select a project folder first."); return; }
    setLoading(true);
    setResult(null);
    setCertOpened(false);
    setCertBlobUrl(null);
    setPodUrl(null);
    setError(null);
    try {
      const res = await scanProject(selectedFiles, name);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGetCertificate = (res: ScanResult) => {
    // ── Step 1: Open local certificate IMMEDIATELY — never fails ─────────────
    const html    = buildLocalCertificateHtml(res, name);
    const blob    = new Blob([html], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
    setCertBlobUrl(blobUrl);
    setCertOpened(true);

    // ── Step 2: Try BrowserPod in background for a shareable link ────────────
    // This runs silently — never blocks the certificate opening above
    setPodUpgrading(true);
    createCertificate(res, name)
      .then((url) => {
        setPodUrl(url);
        setPodUpgrading(false);
      })
      .catch(() => {
        // BrowserPod unavailable — that's fine, local cert already opened
        setPodUpgrading(false);
      });
  };

  const sortedFiles = result
    ? [...result.files].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    : [];

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border p-6 mb-8"
          style={{ borderColor: "hsl(120 33% 16%)", backgroundColor: "hsl(120 33% 5%)" }}
        >
          <h1 className="font-mono font-bold text-xl text-foreground mb-1">Project Scanner</h1>
          <p className="font-mono text-xs text-muted-foreground mb-5">
            Upload a Python project folder to analyse all .py files and generate a certificate
          </p>

          <div className="flex flex-col gap-4">
            {/* Folder Upload */}
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 px-6 cursor-pointer transition-colors"
              style={{ borderColor: "hsl(120 33% 20%)" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                // @ts-expect-error — webkitdirectory is non-standard but widely supported
                webkitdirectory=""
                multiple
                accept=".py"
                onChange={handleFolderSelect}
                className="hidden"
              />
              <span className="text-3xl mb-3">📁</span>
              {selectedFiles ? (
                <div className="text-center">
                  <p className="font-mono text-sm text-foreground font-semibold">
                    {fileCount} Python file{fileCount !== 1 ? "s" : ""} selected
                  </p>
                  <p className="font-mono text-xs text-muted-foreground mt-1">Click to change selection</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-mono text-sm text-muted-foreground">Click to select a project folder</p>
                  <p className="font-mono text-xs text-muted-foreground mt-1">All .py files will be scanned recursively</p>
                </div>
              )}
            </div>

            {/* Project Name + Scan Button */}
            <div className="flex flex-col md:flex-row gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name..."
                className="flex-1 px-4 py-2.5 rounded-md font-mono text-sm bg-input text-foreground border outline-none focus:ring-1 focus:ring-primary"
                style={{ borderColor: "hsl(120 33% 16%)" }}
              />
              <button
                onClick={run}
                disabled={loading || !selectedFiles}
                className="px-6 py-2.5 rounded-md font-mono text-sm font-semibold bg-primary text-primary-foreground glow-hover press-effect disabled:opacity-50"
              >
                {loading ? "Scanning..." : `Scan ${fileCount > 0 ? fileCount + " files" : "Project"}`}
              </button>
            </div>
          </div>

          {error && (
            <p
              className="font-mono text-xs mt-3 px-3 py-2 rounded border"
              style={{ color: "#e05c5c", borderColor: "#e05c5c40", background: "#e05c5c10" }}
            >
              {error}
            </p>
          )}
        </motion.div>

        {loading && <ScanningAnimation />}

        {!loading && result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <CertBanner level={result.summary.certification} large />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Score",         value: result.summary.overall_score, suffix: "/100" },
                { label: "Credits",       value: result.summary.credits },
                { label: "Files Audited", value: result.summary.audited_files },
                { label: "CO₂ Saved/Day", value: result.summary.co2_saved_per_day_kg, decimals: 3, suffix: " kg" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border p-4"
                  style={{ borderColor: "hsl(120 33% 16%)", backgroundColor: "hsl(120 33% 5%)" }}
                >
                  <div className="font-mono text-xs text-muted-foreground mb-1">{s.label}</div>
                  <div className="flex items-baseline gap-1">
                    <AnimatedNumber value={s.value} decimals={s.decimals || 0} className="font-mono text-2xl font-bold text-foreground" />
                    {s.suffix && <span className="font-mono text-xs text-muted-foreground">{s.suffix}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Score + Grade */}
            <div className="flex items-center gap-6">
              <ScoreDial score={result.summary.overall_score} size={140} />
              <div>
                <GradeBadge grade={result.summary.grade} size="lg" />
                <p className="font-mono text-xs text-muted-foreground mt-2">{result.summary.certification_note}</p>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="rounded-lg border p-6" style={{ borderColor: "hsl(120 33% 16%)", backgroundColor: "hsl(120 33% 5%)" }}>
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">
                Per-File Scores (Worst → Best)
              </h3>
              <div style={{ height: Math.max(300, sortedFiles.length * 28) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedFiles} layout="vertical" margin={{ left: 140, right: 20, top: 0, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "#4a7a4a", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="path" tick={{ fill: "#7bd4a0", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={140} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0a1a0a", border: "1px solid #1a3a1a", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 12 }}
                      labelStyle={{ color: "#e0f0e0" }}
                      itemStyle={{ color: "#00e887" }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {sortedFiles.map((f, i) => <Cell key={i} fill={gradeBarColor(f.score)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Issues */}
            <div className="rounded-lg border p-6" style={{ borderColor: "hsl(120 33% 16%)", backgroundColor: "hsl(120 33% 5%)" }}>
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">Top Recurring Issues</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "hsl(120 33% 12%)" }}>
                    <th className="text-left font-mono text-xs text-muted-foreground py-2 px-3">Rule</th>
                    <th className="text-right font-mono text-xs text-muted-foreground py-2 px-3">Occurrences</th>
                  </tr>
                </thead>
                <tbody>
                  {result.top_issues.map((issue) => (
                    <tr key={issue.rule_id} className="border-b" style={{ borderColor: "hsl(120 33% 8%)" }}>
                      <td className="font-mono text-sm text-foreground py-2.5 px-3">{issue.rule_id.replace(/_/g, " ")}</td>
                      <td className="text-right font-mono text-sm text-primary py-2.5 px-3">{issue.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Certificate */}
            <div
              className="rounded-lg border p-6"
              style={{ borderColor: "hsl(120 33% 16%)", backgroundColor: "hsl(120 33% 5%)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Project Certificate
                  </h3>
                  <span
                    className="font-mono text-xs px-2 py-0.5 rounded-full border"
                    style={{ borderColor: "hsl(120 33% 20%)", color: "hsl(120 33% 55%)" }}
                  >
                    via BrowserPod
                  </span>
                </div>
                {/* BrowserPod status dot */}
                {certOpened && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: podUrl ? "#00e887" : podUpgrading ? "#f5c542" : "#4a7a4a",
                        boxShadow: podUrl ? "0 0 6px #00e887" : podUpgrading ? "0 0 6px #f5c542" : "none",
                        transition: "all 0.4s",
                      }}
                    />
                    <span className="font-mono text-xs text-muted-foreground">
                      {podUrl ? "BrowserPod live" : podUpgrading ? "connecting pod..." : "local only"}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-3 text-center">
                {/* Main button — always instant */}
                <button
                  onClick={() => handleGetCertificate(result)}
                  className="px-6 py-3 rounded-lg font-mono text-sm font-semibold border glow-hover press-effect text-foreground transition-all"
                  style={{ borderColor: "hsl(120 33% 20%)" }}
                >
                  {certOpened ? "🏆 Open Certificate Again" : "🏆 Open Certificate"}
                </button>

                <p className="font-mono text-xs text-muted-foreground">
                  Opens instantly in a new tab · BrowserPod shareable link generated in background
                </p>

                {/* Once BrowserPod succeeds, show the shareable URL */}
                {podUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-1 w-full"
                  >
                    <p className="font-mono text-xs" style={{ color: "#00e887" }}>
                      🌱 Shareable BrowserPod link ready:
                    </p>
                    <a
                      href={podUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary underline break-all max-w-sm text-center"
                    >
                      {podUrl}
                    </a>
                    <button
                      onClick={() => navigator.clipboard.writeText(podUrl)}
                      className="mt-1 px-3 py-1 font-mono text-xs rounded border text-muted-foreground hover:text-foreground transition-colors"
                      style={{ borderColor: "hsl(120 33% 20%)" }}
                    >
                      Copy link
                    </button>
                  </motion.div>
                )}

                {/* Reopen local cert link */}
                {certBlobUrl && !podUrl && certOpened && (
                  <p className="font-mono text-xs text-muted-foreground">
                    Opened locally —{" "}
                    <a
                      href={certBlobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      reopen
                    </a>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}
