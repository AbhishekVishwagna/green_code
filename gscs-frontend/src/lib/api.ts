/**
 * src/lib/api.ts — GSCS API Layer (BrowserPod edition)
 *
 * /audit       → analyzeCode() from auditor.ts — pure TypeScript, browser-only
 * /badge       → BrowserPod pod-server via Portal URL — generates shareable badge page
 * /certificate → BrowserPod pod-server via Portal URL — generates printable certificate
 * /scan        → reads uploaded FileList, runs analyzeCode() on each .py file
 */

import { analyzeCode } from "./auditor";
import { getPodService } from "./browserpod";
import type { AuditResult, ScanResult, FileScanResult } from "./types";

// ── /audit ────────────────────────────────────────────────────────────────────

export async function auditCode(code: string): Promise<AuditResult> {
  // Small delay so the scanning animation plays — feels deliberate
  await new Promise((r) => setTimeout(r, 700));
  return analyzeCode(code);
}

// ── Badge (BrowserPod) ────────────────────────────────────────────────────────

/**
 * Creates a shareable badge page on the BrowserPod pod-server.
 * Returns a public Portal URL like https://abc123.browserpod.dev/badge/xyz789
 * The pod boots lazily on first call — subsequent calls are instant.
 */
export async function createBadge(result: AuditResult): Promise<string> {
  const svc = await getPodService();
  return svc.getBadgeUrl({
    score:           result.score,
    grade:           result.grade,
    credits:         result.credits,
    co2_saved_grams: result.co2_saved_grams,
    certification:   result.certification,
  });
}

// ── Certificate (BrowserPod) ──────────────────────────────────────────────────

/**
 * Creates a printable certificate page on the BrowserPod pod-server.
 * Returns a public Portal URL like https://abc123.browserpod.dev/certificate/xyz789
 */
export async function createCertificate(
  result: ScanResult,
  projectName: string
): Promise<string> {
  const svc = await getPodService();
  return svc.getCertificateUrl({
    projectName,
    summary:    result.summary,
    top_issues: result.top_issues,
    files:      result.files,
  });
}

// ── /scan — real file-based analysis ─────────────────────────────────────────

/**
 * Accepts a FileList (from a directory upload) and analyses every .py file
 * using the TypeScript auditor engine. No backend needed.
 */
export async function scanProject(
  files: FileList | File[],
  projectName: string
): Promise<ScanResult> {
  const allFiles = Array.from(files).filter((f) => f.name.endsWith(".py"));

  if (allFiles.length === 0) {
    throw new Error(
      "No Python (.py) files found in the uploaded folder. " +
        "Make sure you selected a project directory containing Python files."
    );
  }

  const fileResults: FileScanResult[] = [];
  let totalScore   = 0;
  let totalCredits = 0;
  let totalCo2     = 0;
  const issueCounts: Record<string, number> = {};

  for (const file of allFiles) {
    const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    try {
      const code   = await file.text();
      const result = analyzeCode(code);

      fileResults.push({ path, score: result.score, grade: result.grade, issues: result.issues.length });
      totalScore   += result.score;
      totalCredits += result.credits;
      totalCo2     += result.co2_saved_grams;

      for (const issue of result.issues) {
        issueCounts[issue.rule_id] = (issueCounts[issue.rule_id] || 0) + 1;
      }
    } catch {
      fileResults.push({ path, score: null, grade: null, issues: 0, parse_error: "Analysis failed" });
    }
  }

  const audited      = fileResults.filter((f) => f.score !== null);
  const overallScore = audited.length > 0 ? Math.round(totalScore / audited.length) : 0;

  let grade: string, certification: string, certNote: string;
  if (overallScore >= 90) {
    grade = "A"; certification = "Platinum";
    certNote = "Exceptional sustainability. This project demonstrates outstanding code efficiency.";
  } else if (overallScore >= 70) {
    grade = "B"; certification = "Gold";
    certNote = "Strong sustainability. This project meets Gold-level efficiency standards.";
  } else if (overallScore >= 50) {
    grade = "C"; certification = "Silver";
    certNote = "Good sustainability. This project meets Silver-level efficiency standards.";
  } else {
    grade = "D"; certification = "None";
    certNote = "Significant improvements needed to meet certification standards.";
  }

  const topIssues = Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([rule_id, count]) => ({ rule_id, count }));

  return {
    summary: {
      overall_score:       overallScore,
      grade,
      credits:             totalCredits,
      certification,
      certification_note:  certNote,
      total_files:         allFiles.length,
      audited_files:       audited.length,
      skipped_files:       allFiles.length - audited.length,
      co2_saved_grams:     parseFloat(totalCo2.toFixed(2)),
      co2_saved_per_day_kg: parseFloat((totalCo2 * 10000 / 1e6).toFixed(4)),
    },
    top_issues:   topIssues,
    files:        fileResults,
    project_name: projectName,
  };
}
