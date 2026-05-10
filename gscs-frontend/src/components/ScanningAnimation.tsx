import { motion } from "framer-motion";

export default function ScanningAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative w-20 h-20">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: "#00e887" }}
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="font-mono text-sm text-primary">Scanning...</p>
        <p className="text-xs text-muted-foreground">Analyzing AST for inefficiencies</p>
      </div>
    </div>
  );
}
