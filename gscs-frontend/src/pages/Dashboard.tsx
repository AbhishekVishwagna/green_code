import { useMemo } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import PageWrapper from "@/components/PageWrapper";
import AnimatedNumber from "@/components/AnimatedNumber";
import GradeBadge from "@/components/GradeBadge";
import type { AuditHistoryEntry } from "@/lib/types";

function getHistory(): AuditHistoryEntry[] {
  const raw = localStorage.getItem("gscs_history");
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

// Seed some demo data if empty
function ensureDemoData(): AuditHistoryEntry[] {
  let h = getHistory();
  if (h.length === 0) {
    const now = Date.now();
    const demo: AuditHistoryEntry[] = [
      { id: "d1", timestamp: now - 6 * 86400000, score: 58, grade: "C", credits: 3, fileName: "utils.py", co2_saved_grams: 0.4 },
      { id: "d2", timestamp: now - 5 * 86400000, score: 64, grade: "B", credits: 4, fileName: "models.py", co2_saved_grams: 0.6 },
      { id: "d3", timestamp: now - 4 * 86400000, score: 55, grade: "C", credits: 2, fileName: "views.py", co2_saved_grams: 0.3 },
      { id: "d4", timestamp: now - 3 * 86400000, score: 72, grade: "B", credits: 5, fileName: "services.py", co2_saved_grams: 0.85 },
      { id: "d5", timestamp: now - 2 * 86400000, score: 78, grade: "B", credits: 6, fileName: "config.py", co2_saved_grams: 1.1 },
      { id: "d6", timestamp: now - 86400000, score: 85, grade: "A", credits: 8, fileName: "main.py", co2_saved_grams: 1.5 },
      { id: "d7", timestamp: now, score: 91, grade: "A", credits: 10, fileName: "types.py", co2_saved_grams: 2.0 },
    ];
    localStorage.setItem("gscs_history", JSON.stringify(demo));
    h = demo;
  }
  return h;
}

export default function Dashboard() {
  const history = useMemo(() => ensureDemoData(), []);

  const totalCredits = history.reduce((s, e) => s + e.credits, 0);

  const chartData = history
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((e) => ({
      date: new Date(e.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: e.score,
    }));

  const sorted = [...history].sort((a, b) => b.score - a.score);
  const best = sorted.slice(0, 5);
  const worst = [...sorted].reverse().slice(0, 5);

  // Streak: consecutive days with score >= 60
  const days = [...new Set(history.filter((e) => e.score >= 60).map((e) => new Date(e.timestamp).toDateString()))];
  const streak = days.length;

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 sm:px-6 sm:py-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono font-bold text-2xl text-foreground"
        >
          Dashboard
        </motion.h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Audits", value: history.length },
            { label: "Total Credits", value: totalCredits },
            { label: "Streak", value: streak, suffix: " days" },
            { label: "Avg Score", value: Math.round(history.reduce((s, e) => s + e.score, 0) / history.length) },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border p-4"
              style={{ borderColor: "hsl(120 33% 16%)", backgroundColor: "hsl(120 33% 5%)" }}
            >
              <div className="font-mono text-xs text-muted-foreground mb-1">{s.label}</div>
              <div className="flex items-baseline gap-1">
                <AnimatedNumber value={s.value} className="font-mono text-2xl font-bold text-foreground" />
                {s.suffix && <span className="font-mono text-xs text-muted-foreground">{s.suffix}</span>}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Line Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border p-6"
          style={{ borderColor: "hsl(120 33% 16%)", backgroundColor: "hsl(120 33% 5%)" }}
        >
          <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">Score Over Time</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a3a1a" />
                <XAxis dataKey="date" tick={{ fill: "#4a7a4a", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#4a7a4a", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0a1a0a", border: "1px solid #1a3a1a", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 12 }}
                  labelStyle={{ color: "#e0f0e0" }}
                  itemStyle={{ color: "#00e887" }}
                />
                <Line type="monotone" dataKey="score" stroke="#00e887" strokeWidth={2} dot={{ fill: "#00e887", r: 4 }} activeDot={{ r: 6, stroke: "#00e887", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { title: "🏆 Best Files", data: best },
            { title: "⚠️ Worst Files", data: worst },
          ].map((section) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border p-6"
              style={{ borderColor: "hsl(120 33% 16%)", backgroundColor: "hsl(120 33% 5%)" }}
            >
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">{section.title}</h3>
              <div className="overflow-x-auto"><table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "hsl(120 33% 12%)" }}>
                    <th className="text-left font-mono text-xs text-muted-foreground py-2">File</th>
                    <th className="text-center font-mono text-xs text-muted-foreground py-2">Grade</th>
                    <th className="text-right font-mono text-xs text-muted-foreground py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {section.data.map((entry) => (
                    <tr key={entry.id} className="border-b" style={{ borderColor: "hsl(120 33% 8%)" }}>
                      <td className="font-mono text-sm text-foreground py-2">{entry.fileName}</td>
                      <td className="text-center py-2"><GradeBadge grade={entry.grade} size="sm" /></td>
                      <td className="text-right font-mono text-sm text-foreground py-2">{entry.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
