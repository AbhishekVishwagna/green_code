import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Issue } from "@/lib/auditor";

const impactColors: Record<string, string> = {
  High:   "#e05c5c",
  Medium: "#f5c542",
  Low:    "#7bd4a0",
  Bonus:  "#00e887",
};

export default function IssueCard({ issue }: { issue: Issue }) {
  const [expanded, setExpanded] = useState(false);
  const isBonus = issue.kind === "bonus";
  const color   = isBonus ? "#00e887" : (impactColors[issue.impact] || "#7bd4a0");
  const pts     = isBonus ? `+${issue.penalty}pts` : `-${Math.abs(issue.penalty)}pts`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="border rounded-lg p-4 cursor-pointer transition-colors"
      style={{
        borderColor: isBonus ? "#00e88730" : "hsl(120 33% 16%)",
        backgroundColor: isBonus ? "#00e88708" : "hsl(120 33% 5%)",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: color, boxShadow: isBonus ? `0 0 5px ${color}` : "none" }}
          />
          <span className="font-mono text-sm text-foreground truncate">{issue.issue}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono flex-shrink-0">
          {issue.line && (
            <span className="text-muted-foreground">Line {issue.line}</span>
          )}
          <span
            className="px-2 py-0.5 rounded font-bold"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {pts}
          </span>
          <span className="text-muted-foreground">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p
              className="mt-3 text-sm text-muted-foreground border-t pt-3"
              style={{ borderColor: "hsl(120 33% 12%)" }}
            >
              {isBonus ? "✅" : "💡"} {issue.suggestion}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
