import { motion } from "framer-motion";

const certColors: Record<string, string> = {
  Platinum: "#e2e8f0",
  Gold: "#f5c542",
  Silver: "#b0b8c1",
  Bronze: "#cd7f32",
  None: "#4a7a4a",
};

export default function CertBanner({ level, large = false }: { level: string; large?: boolean }) {
  const color = certColors[level] || certColors.None;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`relative flex items-center justify-center rounded-lg border overflow-hidden ${large ? "py-8 px-10" : "py-4 px-6"}`}
      style={{
        borderColor: color,
        background: `linear-gradient(135deg, ${color}10, ${color}05)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at 30% 50%, ${color}30, transparent 70%)`,
        }}
      />
      <div className="relative text-center">
        <div className="font-mono text-xs uppercase tracking-[0.3em] mb-2" style={{ color: `${color}aa` }}>
          Certification Level
        </div>
        <div
          className={`font-mono font-bold tracking-wider ${large ? "text-4xl" : "text-2xl"}`}
          style={{ color }}
        >
          {level}
        </div>
      </div>
    </motion.div>
  );
}
