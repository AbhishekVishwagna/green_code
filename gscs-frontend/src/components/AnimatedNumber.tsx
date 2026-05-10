import { useEffect, useRef } from "react";
import { useMotionValue, useSpring } from "framer-motion";

export default function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 30, stiffness: 80 });
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    mv.set(value);
    const unsub = spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`;
    });
    return unsub;
  }, [value, mv, spring, decimals, prefix, suffix]);

  return <span ref={ref} className={className}>{prefix}0{suffix}</span>;
}
