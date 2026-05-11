import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import PageWrapper from "@/components/PageWrapper";
import ScoreDial from "@/components/ScoreDial";
import GradeBadge from "@/components/GradeBadge";
import IssueCard from "@/components/IssueCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import ScanningAnimation from "@/components/ScanningAnimation";
import CertBanner from "@/components/CertBanner";
import { auditCode, createBadge } from "@/lib/api";
import type { AuditResult, AuditHistoryEntry } from "@/lib/types";

const defaultCode = `import time

def process_data(items):
    result = ""
    for i in range(len(items)):
        for j in range(len(items)):
            if items[i] == items[j]:
                result = result + str(items[i])
    temp = 42  # unused variable
    time.sleep(0.1)
    return result
`;

function saveToHistory(result: AuditResult) {
  const history: AuditHistoryEntry[] = JSON.parse(
    localStorage.getItem("gscs_history") || "[]"
  );
  history.push({
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    score: result.score,
    grade: result.grade,
    credits: result.credits,
    fileName: "audit_" + new Date().toISOString().slice(0, 10),
    co2_saved_grams: result.co2_saved_grams,
  });
  localStorage.setItem("gscs_history", JSON.stringify(history));
}

function buildLocalBadgeUrl(result: AuditResult): string {
  const params = new URLSearchParams({
    score:   String(result.score),
    grade:   result.grade,
    credits: String(result.credits),
    co2:     String(result.co2_saved_grams),
    cert:    result.certification,
  });
  return `${window.location.origin}/badge-preview?${params.toString()}`;
}

export default function Audit() {
  const [code, setCode]           = useState(defaultCode);
  const [result, setResult]       = useState<AuditResult | null>(null);
  const [loading, setLoading]     = useState(false);
  const [badgeStatus, setBadgeStatus] = useState<"idle"|"booting"|"copied"|"error">("idle");
  const [badgeMessage, setBadgeMessage] = useState<string|null>(null);
  const [podReady, setPodReady]   = useState(false);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setBadgeStatus("idle");
    setBadgeMessage(null);
    try {
      const res = await auditCode(code);
      setResult(res);
      saveToHistory(res);
    } finally {
      setLoading(false);
    }
  }, [code]);

  const handleCopyBadge = useCallback(async () => {
    if (!result) return;
    setBadgeStatus("booting");
    setBadgeMessage(null);
    try {
      const url = await createBadge(result);
      await navigator.clipboard.writeText(url);
      setPodReady(true);
      setBadgeStatus("copied");
      setBadgeMessage("🌱 Live badge link copied — hosted on your BrowserPod server!");
      setTimeout(() => setBadgeStatus("idle"), 4000);
    } catch {
      try {
        await navigator.clipboard.writeText(buildLocalBadgeUrl(result));
        setBadgeStatus("copied");
        setBadgeMessage("Badge link copied (local preview — add VITE_BP_APIKEY for BrowserPod links)");
        setTimeout(() => setBadgeStatus("idle"), 5000);
      } catch {
        setBadgeStatus("error");
        setBadgeMessage("Could not copy — try again.");
      }
    }
  }, [result]);

  const badgeLabel = () => {
    switch (badgeStatus) {
      case "booting": return podReady ? "Generating..." : "⏳ Booting pod...";
      case "copied":  return "✓ Copied!";
      case "error":   return "Try again";
      default:        return "Copy Badge Link";
    }
  };

  // Separate penalties and bonuses from result
  const penalties = result?.issues?.filter(i => i.kind === "penalty") ?? [];
  const bonuses   = result?.issues?.filter(i => i.kind === "bonus")   ?? [];

  return (
    <PageWrapper>
      <div className="flex flex-col md:h-[calc(100vh-3.5rem)] md:flex-row">

        {/* Editor */}
        <div className="flex flex-col border-b md:flex-1 md:border-b-0 md:border-r" style={{ borderColor: "hsl(120 33% 12%)" }}>
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "hsl(120 33% 12%)", backgroundColor: "hsl(120 33% 4%)" }}
          >
            <span className="font-mono text-xs text-muted-foreground">main.py</span>
            <button
              onClick={runAudit}
              disabled={loading}
              className="px-4 py-1.5 rounded-md font-mono text-xs font-semibold bg-primary text-primary-foreground glow-hover press-effect disabled:opacity-50"
            >
              {loading ? "Scanning..." : "Run Audit ▶"}
            </button>
          </div>
          <div className="h-[50vh] md:flex-1">
            <Editor
              height="100%"
              defaultLanguage="python"
              value={code}
              onChange={(v) => setCode(v || "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "JetBrains Mono, monospace",
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                padding: { top: 16 },
              }}
            />
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto md:flex-1" style={{ backgroundColor: "hsl(120 33% 3%)" }}>
          {loading && <ScanningAnimation />}

          {!loading && !result && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <p className="font-mono text-lg text-muted-foreground mb-2">Ready to audit</p>
              <p className="text-sm text-muted-foreground">Paste Python code and click "Run Audit"</p>
            </div>
          )}

          {!loading && result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">

              {/* Score + Grade */}
              <div className="flex flex-wrap items-center gap-6">
                <ScoreDial score={result.score} />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <GradeBadge grade={result.grade} size="lg" />
                    <span className="font-mono text-sm text-muted-foreground">{result.label}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-lg">🌿</span>
                      <AnimatedNumber value={result.credits} className="font-mono text-xl font-bold text-foreground" />
                      <span className="font-mono text-xs text-muted-foreground">credits earned</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-lg">💨</span>
                      <AnimatedNumber value={result.co2_saved_grams} decimals={2} className="font-mono text-xl font-bold text-foreground" />
                      <span className="font-mono text-xs text-muted-foreground">g CO₂ saved</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score breakdown bar */}
              <div className="rounded-lg border p-4 space-y-2" style={{ borderColor: "hsl(120 33% 16%)", backgroundColor: "hsl(120 33% 5%)" }}>
                <div className="flex justify-between font-mono text-xs text-muted-foreground">
                  <span>Score breakdown</span>
                  <span>100 {result.total_penalty !== 0 ? `${result.total_penalty}` : ""}{result.total_bonus > 0 ? ` +${result.total_bonus}` : ""} = <strong className="text-foreground">{result.score}</strong></span>
                </div>
                <div className="h-2 rounded-full overflow-hidden flex" style={{ background: "hsl(120 33% 10%)" }}>
                  <div
                    className="h-full rounded-l-full"
                    style={{
                      width: `${result.score}%`,
                      background: result.score >= 90 ? "#00e887" : result.score >= 70 ? "#7bd4a0" : result.score >= 50 ? "#f5c542" : "#e05c5c",
                      transition: "width 0.8s ease",
                    }}
                  />
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span style={{ color: "#e05c5c" }}>{penalties.length} penalties ({result.total_penalty} pts)</span>
                  <span style={{ color: "#00e887" }}>{bonuses.length} bonuses (+{result.total_bonus} pts)</span>
                </div>
              </div>

              {/* Certification */}
              <CertBanner level={result.certification} />

              {/* Bonuses */}
              <AnimatePresence>
                {bonuses.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3 className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: "#00e887" }}>
                      ✅ Green Practices Detected ({bonuses.length})
                    </h3>
                    <div className="space-y-2">
                      {bonuses.map((issue, i) => (
                        <IssueCard key={i} issue={issue} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Penalties */}
              <div>
                <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  ⚠ Issues Found ({penalties.length})
                </h3>
                <div className="space-y-2">
                  {penalties.length === 0 ? (
                    <p className="font-mono text-sm text-muted-foreground">No issues detected 🌱</p>
                  ) : (
                    penalties.map((issue, i) => <IssueCard key={i} issue={issue} />)
                  )}
                </div>
              </div>

              {/* Badge */}
              <div
                className="border rounded-lg p-4"
                style={{ borderColor: "hsl(120 33% 16%)", backgroundColor: "hsl(120 33% 5%)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Shareable Badge</h3>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: podReady ? "#00e887" : "hsl(120 33% 30%)", boxShadow: podReady ? "0 0 6px #00e887" : "none" }} />
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: "hsl(120 33% 20%)", color: "hsl(120 33% 55%)" }}>via BrowserPod</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-3 rounded border px-4 py-2" style={{ borderColor: "hsl(120 33% 16%)" }}>
                    <span className="font-mono text-xs text-muted-foreground">Green Code</span>
                    <GradeBadge grade={result.grade} size="sm" />
                    <span className="font-mono text-xs text-foreground">{result.score}/100</span>
                  </div>
                  <button
                    onClick={handleCopyBadge}
                    disabled={badgeStatus === "booting"}
                    className="px-3 py-1.5 rounded-md font-mono text-xs border glow-hover press-effect text-muted-foreground hover:text-foreground disabled:opacity-60"
                    style={{ borderColor: "hsl(120 33% 16%)" }}
                  >
                    {badgeLabel()}
                  </button>
                </div>
                {badgeMessage && (
                  <p className="font-mono text-xs mt-2" style={{ color: badgeStatus === "error" ? "#e05c5c" : "hsl(120 33% 50%)" }}>
                    {badgeMessage}
                  </p>
                )}
              </div>

            </motion.div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
