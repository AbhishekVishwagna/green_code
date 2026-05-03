import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface ScoreDialProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const gradeColor = (score: number) => {
  if (score >= 80) return "#00e887";
  if (score >= 60) return "#7bd4a0";
  if (score >= 40) return "#f5c542";
  return "#e05c5c";
};

export default function ScoreDial({ score, size = 180, strokeWidth = 10 }: ScoreDialProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = gradeColor(score);

  const motionScore = useMotionValue(0);
  const springScore = useSpring(motionScore, { damping: 30, stiffness: 80 });
  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionScore.set(score);
    const unsubscribe = springScore.on("change", (v) => {
      if (displayRef.current) displayRef.current.textContent = Math.round(v).toString();
    });
    return unsubscribe;
  }, [score, motionScore, springScore]);

  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(120 33% 12%)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span ref={displayRef} className="font-mono text-4xl font-bold" style={{ color }}>
          0
        </span>
        <span className="text-muted-foreground text-xs font-mono mt-1">/ 100</span>
      </div>
    </div>
  );
}
