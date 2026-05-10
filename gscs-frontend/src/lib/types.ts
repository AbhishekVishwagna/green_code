// types.ts — GSCS shared type definitions

export interface Issue {
  rule_id: string;
  issue: string;
  impact: "High" | "Medium" | "Low";
  penalty: number;
  line: number | null;
  suggestion: string;
}

export interface AuditResult {
  score: number;
  grade: "A" | "B" | "C" | "D";
  label: string;
  credits: number;
  certification: string;
  co2_saved_grams: number;
  co2_saved_per_day_kg: number;
  energy_saved_wh?: number;
  issues: Issue[];
}

export interface AuditHistoryEntry {
  id: string;
  timestamp: number;
  score: number;
  grade: string;
  credits: number;
  fileName: string;
  co2_saved_grams: number;
}

export interface FileScanResult {
  path: string;
  score: number | null;
  grade: string | null;
  issues: number;
  parse_error?: string;
}

export interface ScanSummary {
  overall_score: number;
  grade: string;
  credits: number;
  certification: string;
  certification_note: string;
  total_files: number;
  audited_files: number;
  skipped_files: number;
  co2_saved_grams: number;
  co2_saved_per_day_kg: number;
}

export interface ScanResult {
  summary: ScanSummary;
  top_issues: Array<{ rule_id: string; count: number }>;
  files: FileScanResult[];
  project_name?: string;
}
