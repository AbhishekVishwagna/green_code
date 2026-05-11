import { lazy, Suspense, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { BadgeCheck, Microscope, Sprout, Zap } from "lucide-react";
import CardSwap, { Card } from "@/components/CardSwap";
import PageWrapper from "@/components/PageWrapper";
import PodStatusBar from "@/components/PodStatusBar";

const EcoTreeScene = lazy(() => import("@/components/EcoTreeScene"));

const features = [
  {
    title: "Instant AST Analysis",
    desc: "Deep analysis of your Python source code using Abstract Syntax Trees to detect computational waste.",
    Icon: Microscope,
  },
  {
    title: "Carbon Credits",
    desc: "Earn Green Credits for writing efficient code. Track your sustainability score over time.",
    Icon: Sprout,
  },
  {
    title: "Project Certification",
    desc: "Get Platinum to Bronze certification for entire projects before deployment.",
    Icon: BadgeCheck,
  },
];

function LandingCardStack() {
  return (
    <div className="relative hidden min-h-[520px] lg:block">
      <CardSwap width={390} height={270} cardDistance={48} verticalDistance={58} delay={3600} pauseOnHover>
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Live Audit</span>
            <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-xs text-primary">Score 92</span>
          </div>
          <div className="mb-5 font-mono text-4xl font-bold text-foreground">Platinum</div>
          <p className="font-mono text-sm leading-6 text-muted-foreground">
            Detects nested loops, busy waits, heavy imports, and memory spikes before they reach production.
          </p>
        </Card>

        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Carbon Model</span>
            <span className="rounded-full bg-[#7bd4a0]/10 px-3 py-1 font-mono text-xs text-[#7bd4a0]">CO2</span>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <div className="font-mono text-2xl font-bold text-primary">1.8g</div>
              <div className="font-mono text-[10px] text-muted-foreground">per run saved</div>
            </div>
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <div className="font-mono text-2xl font-bold text-primary">18kg</div>
              <div className="font-mono text-[10px] text-muted-foreground">daily avoided</div>
            </div>
          </div>
          <p className="font-mono text-sm leading-6 text-muted-foreground">
            Turns code smells into clear energy and carbon impact signals.
          </p>
        </Card>

        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Certification</span>
            <span className="rounded-full border border-[#f5c542]/40 px-3 py-1 font-mono text-xs text-[#f5c542]">Badge</span>
          </div>
          <div className="mb-5 h-24 rounded-lg border border-[#f5c542]/30 bg-[#f5c542]/10 p-4">
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#f5c542]">Green Code Certified</div>
            <div className="mt-3 font-mono text-3xl font-bold text-[#f5c542]">Gold</div>
          </div>
          <p className="font-mono text-sm leading-6 text-muted-foreground">
            Share a BrowserPod-hosted proof of sustainable code quality.
          </p>
        </Card>
      </CardSwap>
    </div>
  );
}

function CarbonCounter() {
  const mv = useMotionValue(14283);
  const spring = useSpring(mv, { damping: 50, stiffness: 20 });
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      mv.set(mv.get() + Math.random() * 2 + 0.5);
    }, 100);
    const unsub = spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = v.toFixed(1);
    });
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [mv, spring]);

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span ref={ref} className="font-mono text-4xl font-bold text-primary sm:text-5xl">
        14283.0
      </span>
      <span className="font-mono text-sm text-muted-foreground">kg CO2 saved</span>
    </div>
  );
}

export default function Landing() {
  return (
    <PageWrapper>
      <PodStatusBar />

      <section className="hero-eco-bg relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
        <Suspense fallback={null}>
          <EcoTreeScene />
        </Suspense>
        <div className="hero-vignette absolute inset-0" />

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-6xl items-center gap-8 px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[0.92fr_1.08fr]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-left"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
              <Zap className="h-3.5 w-3.5" />
              Live carbon-aware auditing
            </div>

            <h1 className="mb-5 font-mono text-3xl font-bold leading-tight text-foreground sm:text-5xl md:text-7xl">
              Code greener.
              <span className="block text-primary">Ship cleaner.</span>
            </h1>

            <p className="mb-8 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Audit your Python code for computational inefficiencies that cause unnecessary carbon emissions. Score,
              certify, and improve.
            </p>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mb-9"
            >
              <CarbonCounter />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Link
                to="/audit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 font-mono text-sm font-semibold text-primary-foreground shadow-[0_0_28px_rgba(0,232,135,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(0,232,135,0.42)] press-effect sm:w-auto sm:justify-start"
              >
                Audit Your Code
                <span aria-hidden="true">-&gt;</span>
              </Link>
            </motion.div>
          </motion.div>

          <LandingCardStack />
        </div>
      </section>

      <section className="relative z-20 -mt-10 mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map(({ Icon, ...f }, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="animate-gradient-border rounded-lg border p-6"
              style={{ backgroundColor: "hsl(120 33% 5%)" }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-mono font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t py-16" style={{ borderColor: "hsl(120 33% 12%)" }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6">
          <div
            className="flex items-center gap-4 rounded-lg border px-6 py-4"
            style={{ borderColor: "#f5c542", backgroundColor: "#f5c54208" }}
          >
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Certified</span>
            <span className="font-mono font-bold" style={{ color: "#f5c542" }}>
              Gold
            </span>
            <span className="font-mono text-xs text-muted-foreground">Score: 72/100</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground">Green Code (c) 2026</p>
        </div>
      </footer>
    </PageWrapper>
  );
}
