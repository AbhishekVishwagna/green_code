import { motion } from "framer-motion";

const colors: Record<string, string> = {
  A: "hsl(152 100% 45%)",
  B: "hsl(148 42% 65%)",
  C: "hsl(43 89% 61%)",
  D: "hsl(0 62% 62%)",
};

export default function GradeBadge({ grade, size = "md" }: { grade: string; size?: "sm" | "md" | "lg" }) {
  const bg = colors[grade] || colors.D;
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`inline-flex items-center font-mono font-bold rounded-md ${sizeClasses[size]}`}
      style={{ backgroundColor: bg, color: "#060e06" }}
    >
      {grade}
    </motion.span>
  );
}
