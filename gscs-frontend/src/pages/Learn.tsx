import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageWrapper from "@/components/PageWrapper";
import { analyzeCode } from "@/lib/auditor";

// ── Levels ────────────────────────────────────────────────────────────────────

const LEVELS = [
  {
    id: 1,
    title: "The Nested Loop Trap",
    xp: 100,
    badge: "🔄",
    concept: "Nested loops are O(n²) — they scale catastrophically. A loop inside a loop means n×n operations.",
    tip: "Fix the nested loop by using a dictionary or set instead of scanning the inner list.",
    broken_code: `def find_duplicates(items):
    result = []
    for i in range(len(items)):
        for j in range(len(items)):
            if i != j and items[i] == items[j]:
                if items[i] not in result:
                    result.append(items[i])
    return result`,
    target_rule: "nested_loop",
    hint: "Use a set() to track seen items in a single pass — no inner loop needed.",
    solution: `def find_duplicates(items):
    seen = set()
    duplicates = set()
    for item in items:
        if item in seen:
            duplicates.add(item)
        seen.add(item)
    return list(duplicates)`,
  },
  {
    id: 2,
    title: "The String Concat Crime",
    xp: 80,
    badge: "🧵",
    concept: "In Python, strings are immutable. result += str(x) inside a loop creates a brand new string object every iteration.",
    tip: "Collect items in a list and use ''.join() once at the end — O(n) instead of O(n²) memory.",
    broken_code: `def build_report(data):
    report = ""
    for item in data:
        report = report + str(item) + ", "
    return report`,
    target_rule: "string_concat_loop",
    hint: "Replace string += with list.append() and join at the end.",
    solution: `def build_report(data):
    parts = []
    for item in data:
        parts.append(str(item) + ", ")
    return "".join(parts)`,
  },
  {
    id: 3,
    title: "The Unused Import Tax",
    xp: 60,
    badge: "📦",
    concept: "Every imported module is loaded into memory when your program starts — even if you never use it.",
    tip: "Remove any import that isn't actually used anywhere in the code.",
    broken_code: `import time
import os
import sys
import json

def greet(name):
    return "Hello, " + name`,
    target_rule: "unused_import",
    hint: "Only keep the imports you actually use. This function uses none of them.",
    solution: `def greet(name):
    return "Hello, " + name`,
  },
  {
    id: 4,
    title: "The List Membership Misuse",
    xp: 80,
    badge: "🎯",
    concept: "Checking x in [list] scans every element — O(n). A set stores items in a hash table, so x in {set} is O(1).",
    tip: "Convert the list to a set before the loop to get instant membership lookups.",
    broken_code: `def filter_valid(items, allowed):
    result = []
    for item in items:
        if item in allowed:
            result.append(item)
    return result

allowed = [1, 2, 3, 4, 5]`,
    target_rule: "list_membership",
    hint: "Convert allowed to a set: allowed_set = set(allowed) before the loop.",
    solution: `def filter_valid(items, allowed):
    allowed_set = set(allowed)
    result = []
    for item in items:
        if item in allowed_set:
            result.append(item)
    return result

allowed = [1, 2, 3, 4, 5]`,
  },
  {
    id: 5,
    title: "The Heavy Import Hazard",
    xp: 90,
    badge: "⚡",
    concept: "Libraries like TensorFlow and PyTorch take seconds to import and hundreds of MB of RAM — even for tiny tasks.",
    tip: "Move the import inside the function that needs it (lazy import), so it only loads when actually called.",
    broken_code: `import tensorflow as tf
import numpy as np

def add_numbers(a, b):
    return a + b`,
    target_rule: "heavy_import",
    hint: "Move heavy imports inside the function, or use a lightweight alternative.",
    solution: `def add_numbers(a, b):
    return a + b`,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStoredXP(): number {
  try { return parseInt(localStorage.getItem("gscs_learn_xp") || "0"); } catch { return 0; }
}
function getStoredCompleted(): number[] {
  try { return JSON.parse(localStorage.getItem("gscs_learn_completed") || "[]"); } catch { return []; }
}
function saveProgress(xp: number, completed: number[]) {
  try {
    localStorage.setItem("gscs_learn_xp", String(xp));
    localStorage.setItem("gscs_learn_completed", JSON.stringify(completed));
  } catch { /* ignore */ }
}

const RANK_LABELS = [
  { min: 0,   label: "Seedling",    icon: "🌱", color: "#4a7a4a" },
  { min: 60,  label: "Sprout",      icon: "🌿", color: "#7bd4a0" },
  { min: 150, label: "Green Coder", icon: "💚", color: "#00e887" },
  { min: 280, label: "Eco Hacker",  icon: "⚡", color: "#f5c542" },
  { min: 400, label: "Carbon Zero", icon: "🏆", color: "#e2e8f0" },
];
function getRank(xp: number) {
  for (let i = RANK_LABELS.length - 1; i >= 0; i--) {
    if (xp >= RANK_LABELS[i].min) return RANK_LABELS[i];
  }
  return RANK_LABELS[0];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Learn() {
  const [xp, setXp] = useState(getStoredXP);
  const [completed, setCompleted] = useState<number[]>(getStoredCompleted);
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [userCode, setUserCode] = useState("");
  const [feedback, setFeedback] = useState<null | { passed: boolean; message: string; xpEarned: number }>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const rank = getRank(xp);
  const totalXP = LEVELS.reduce((s, l) => s + l.xp, 0);

  const openLevel = useCallback((id: number) => {
    const level = LEVELS.find(l => l.id === id)!;
    setUserCode(level.broken_code);
    setActiveLevel(id);
    setFeedback(null);
    setShowHint(false);
    setShowSolution(false);
  }, []);

  const checkCode = useCallback(() => {
    if (activeLevel === null) return;
    const level = LEVELS.find(l => l.id === activeLevel)!;
    const result = analyzeCode(userCode);
    const hasIssue = result.issues.some(i => i.rule_id === level.target_rule);

    if (!hasIssue) {
      // Fixed!
      const alreadyDone = completed.includes(activeLevel);
      const earned = alreadyDone ? 0 : level.xp;
      const newXp = xp + earned;
      const newCompleted = alreadyDone ? completed : [...completed, activeLevel];
      setXp(newXp);
      setCompleted(newCompleted);
      saveProgress(newXp, newCompleted);
      setFeedback({
        passed: true,
        message: alreadyDone
          ? "Already fixed! Great refresher. ✓"
          : `Issue fixed! +${earned} XP earned 🌱`,
        xpEarned: earned,
      });
    } else {
      const issue = result.issues.find(i => i.rule_id === level.target_rule)!;
      setFeedback({
        passed: false,
        message: `Still found: "${issue.issue}" — ${issue.suggestion}`,
        xpEarned: 0,
      });
    }
  }, [activeLevel, userCode, xp, completed]);

  const resetProgress = () => {
    setXp(0);
    setCompleted([]);
    saveProgress(0, []);
  };

  const level = activeLevel !== null ? LEVELS.find(l => l.id === activeLevel)! : null;

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header + XP Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
            <div>
              <h1 className="font-mono font-bold text-2xl text-foreground">Green Coding Academy</h1>
              <p className="font-mono text-sm text-muted-foreground mt-1">
                Fix real inefficient code — earn XP — learn why it matters for the planet
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 28 }}>{rank.icon}</span>
              <div>
                <div className="font-mono text-sm font-bold" style={{ color: rank.color }}>{rank.label}</div>
                <div className="font-mono text-xs text-muted-foreground">{xp} / {totalXP} XP</div>
              </div>
              <button
                onClick={resetProgress}
                className="font-mono text-xs text-muted-foreground border rounded px-2 py-1"
                style={{ borderColor: "hsl(120 33% 16%)" }}
              >
                Reset
              </button>
            </div>
          </div>
          {/* XP progress bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(120 33% 10%)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: rank.color }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (xp / totalXP) * 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        {/* Level Grid — shown when no level active */}
        {activeLevel === null && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LEVELS.map((lvl, i) => {
              const done = completed.includes(lvl.id);
              return (
                <motion.div
                  key={lvl.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  onClick={() => openLevel(lvl.id)}
                  className="rounded-xl border p-5 cursor-pointer transition-all"
                  style={{
                    borderColor: done ? "#00e88740" : "hsl(120 33% 16%)",
                    backgroundColor: done ? "#00e88708" : "hsl(120 33% 5%)",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ fontSize: 28 }}>{lvl.badge}</span>
                    {done && <span className="font-mono text-xs text-primary">✓ +{lvl.xp} XP</span>}
                    {!done && <span className="font-mono text-xs text-muted-foreground">+{lvl.xp} XP</span>}
                  </div>
                  <div className="font-mono text-sm font-bold text-foreground mb-1">Level {lvl.id}: {lvl.title}</div>
                  <div className="font-mono text-xs text-muted-foreground leading-relaxed">{lvl.concept.slice(0, 80)}...</div>
                  <div
                    className="mt-3 text-center py-2 rounded-lg font-mono text-xs font-bold"
                    style={{
                      background: done ? "#00e88720" : "hsl(120 33% 10%)",
                      color: done ? "#00e887" : "#7bd4a0",
                    }}
                  >
                    {done ? "✓ Completed — Play Again" : "▶ Start Challenge"}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Active Level */}
        <AnimatePresence>
          {level && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Back + title */}
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setActiveLevel(null)}
                  className="font-mono text-xs text-muted-foreground border rounded px-3 py-1.5"
                  style={{ borderColor: "hsl(120 33% 16%)" }}
                >
                  ← Back
                </button>
                <div>
                  <span style={{ fontSize: 20 }}>{level.badge}</span>
                  <span className="font-mono font-bold text-foreground ml-2">Level {level.id}: {level.title}</span>
                </div>
                <span className="font-mono text-xs ml-auto" style={{ color: "#f5c542" }}>+{level.xp} XP</span>
              </div>

              {/* Concept card */}
              <div
                className="rounded-xl border p-4 mb-6"
                style={{ borderColor: "#00e88730", backgroundColor: "#00e88708" }}
              >
                <div className="font-mono text-xs uppercase tracking-wider text-primary mb-2">Why This Matters</div>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">{level.concept}</p>
                <p className="font-mono text-xs mt-2" style={{ color: "#f5c542" }}>💡 {level.tip}</p>
              </div>

              {/* Code editor + feedback */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Your Code — Fix the Issue Below
                  </div>
                  <textarea
                    value={userCode}
                    onChange={e => { setUserCode(e.target.value); setFeedback(null); }}
                    spellCheck={false}
                    rows={14}
                    className="w-full rounded-xl border p-4 font-mono text-sm resize-none outline-none focus:ring-1 focus:ring-primary"
                    style={{
                      background: "hsl(120 33% 3%)",
                      borderColor: "hsl(120 33% 16%)",
                      color: "#c8e8c8",
                      lineHeight: 1.7,
                    }}
                  />
                </div>
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Original Broken Code
                  </div>
                  <pre
                    className="rounded-xl border p-4 font-mono text-xs overflow-auto"
                    style={{
                      background: "hsl(120 33% 3%)",
                      borderColor: "#e05c5c30",
                      color: "#e05c5c",
                      lineHeight: 1.7,
                      minHeight: "14rem",
                    }}
                  >
                    {level.broken_code}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap mb-4">
                <button
                  onClick={checkCode}
                  className="px-6 py-2.5 rounded-lg font-mono text-sm font-bold"
                  style={{ background: "#00e887", color: "#060e06" }}
                >
                  Check My Fix ▶
                </button>
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="px-4 py-2.5 rounded-lg font-mono text-sm border"
                  style={{ borderColor: "#f5c54250", color: "#f5c542" }}
                >
                  {showHint ? "Hide Hint" : "💡 Show Hint"}
                </button>
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="px-4 py-2.5 rounded-lg font-mono text-sm border"
                  style={{ borderColor: "hsl(120 33% 20%)", color: "#7bd4a0" }}
                >
                  {showSolution ? "Hide Solution" : "👁 Show Solution"}
                </button>
                <button
                  onClick={() => { setUserCode(level.broken_code); setFeedback(null); }}
                  className="px-4 py-2.5 rounded-lg font-mono text-sm border ml-auto"
                  style={{ borderColor: "hsl(120 33% 16%)", color: "#4a7a4a" }}
                >
                  Reset Code
                </button>
              </div>

              {/* Hint */}
              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border p-4 mb-4"
                    style={{ borderColor: "#f5c54240", backgroundColor: "#f5c54208" }}
                  >
                    <span className="font-mono text-xs text-yellow-400">💡 Hint: </span>
                    <span className="font-mono text-xs text-muted-foreground">{level.hint}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Solution */}
              <AnimatePresence>
                {showSolution && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border p-4 mb-4"
                    style={{ borderColor: "#00e88730", backgroundColor: "#00e88708" }}
                  >
                    <div className="font-mono text-xs text-primary mb-2 uppercase tracking-wider">Model Solution</div>
                    <pre className="font-mono text-xs text-muted-foreground leading-relaxed overflow-auto">{level.solution}</pre>
                    <button
                      onClick={() => { setUserCode(level.solution); setFeedback(null); setShowSolution(false); }}
                      className="mt-3 font-mono text-xs px-3 py-1.5 rounded border"
                      style={{ borderColor: "#00e88740", color: "#00e887" }}
                    >
                      Use This Solution
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Feedback */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: feedback.passed ? "#00e88750" : "#e05c5c50",
                      backgroundColor: feedback.passed ? "#00e88710" : "#e05c5c10",
                    }}
                  >
                    <div
                      className="font-mono font-bold text-sm mb-1"
                      style={{ color: feedback.passed ? "#00e887" : "#e05c5c" }}
                    >
                      {feedback.passed ? "✓ Issue Fixed!" : "✗ Not quite right"}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground leading-relaxed">{feedback.message}</div>
                    {feedback.passed && feedback.xpEarned > 0 && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
                        className="mt-3 font-mono text-2xl font-bold text-center"
                        style={{ color: "#f5c542" }}
                      >
                        +{feedback.xpEarned} XP 🎉
                      </motion.div>
                    )}
                    {feedback.passed && (
                      <button
                        onClick={() => setActiveLevel(null)}
                        className="mt-3 w-full py-2 rounded-lg font-mono text-sm font-bold"
                        style={{ background: "#00e88720", color: "#00e887", border: "1px solid #00e88740" }}
                      >
                        ← Back to Levels
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All done */}
        {completed.length === LEVELS.length && activeLevel === null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="mt-10 rounded-xl border p-8 text-center"
            style={{ borderColor: "#f5c54250", backgroundColor: "#f5c54208" }}
          >
            <div style={{ fontSize: 56 }} className="mb-4">🏆</div>
            <div className="font-mono font-bold text-2xl text-foreground mb-2">Carbon Zero Developer!</div>
            <div className="font-mono text-muted-foreground text-sm mb-4">
              You completed all {LEVELS.length} levels and earned {totalXP} XP.<br />
              You now know the most impactful green coding patterns. Go apply them!
            </div>
            <div className="font-mono text-primary text-sm">🌱 Every efficient line of code is a vote for a sustainable digital future</div>
          </motion.div>
        )}

      </div>
    </PageWrapper>
  );
}
