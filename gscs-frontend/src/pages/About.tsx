import { motion, useScroll, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import { BadgeCheck, BrainCircuit, CloudOff, Code2, Cpu, GraduationCap, Leaf, Server } from "lucide-react";
import CardSwap, { Card } from "@/components/CardSwap";
import PageWrapper from "@/components/PageWrapper";

const stats = [
  { value: "3-4%", label: "of global CO2 emissions come from ICT" },
  { value: "10x", label: "more energy used by inefficient code paths" },
  { value: "490g", label: "CO2 per kWh global grid intensity" },
  { value: "0", label: "cloud servers needed for BrowserPod sharing" },
];

const rules = [
  { Icon: Cpu, title: "Avoid Nested Loops", desc: "O(n2) and O(n3) loops are flagged with clear refactor guidance.", penalty: "-35 pts" },
  { Icon: Server, title: "Trim Heavy Imports", desc: "Large libraries are expensive at startup and easy to lazy-load.", penalty: "-10 pts" },
  { Icon: Code2, title: "Remove Dead Code", desc: "Unused variables, imports, and functions waste parsing and memory.", penalty: "-15 pts" },
  { Icon: BrainCircuit, title: "Prefer Built-ins", desc: "Native Python operations often beat manual interpreter loops.", penalty: "bonus" },
  { Icon: Leaf, title: "Reward Better Patterns", desc: "Generators, sets, f-strings, and selective imports earn credit.", penalty: "bonus" },
];

const mission = [
  {
    title: "For learners",
    text: "Green Code turns invisible compute waste into feedback students can understand, compare, and improve.",
    Icon: GraduationCap,
  },
  {
    title: "For projects",
    text: "Folder scans summarize files, top issues, grades, and certification status before deployment.",
    Icon: BadgeCheck,
  },
  {
    title: "For low-carbon sharing",
    text: "BrowserPod runs Node.js in the browser, creating shareable badges without deploying a backend.",
    Icon: CloudOff,
  },
];

function AboutCardStack() {
  return (
    <div className="relative hidden min-h-[430px] lg:block">
      <CardSwap width={360} height={240} cardDistance={42} verticalDistance={50} delay={3300} pauseOnHover skewAmount={5}>
        <Card className="p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Leaf className="h-5 w-5" />
          </div>
          <h3 className="mb-3 font-mono text-2xl font-bold text-foreground">Make impact visible</h3>
          <p className="font-mono text-sm leading-6 text-muted-foreground">
            Every issue links code structure to CPU cycles, memory pressure, and carbon cost.
          </p>
        </Card>
        <Card className="p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Code2 className="h-5 w-5" />
          </div>
          <h3 className="mb-3 font-mono text-2xl font-bold text-foreground">Teach the fix</h3>
          <p className="font-mono text-sm leading-6 text-muted-foreground">
            Suggestions point learners toward sets, generators, batching, caching, and simpler algorithms.
          </p>
        </Card>
        <Card className="p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
            <CloudOff className="h-5 w-5" />
          </div>
          <h3 className="mb-3 font-mono text-2xl font-bold text-foreground">Share without cloud</h3>
          <p className="font-mono text-sm leading-6 text-muted-foreground">
            BrowserPod gives the project a live server experience while keeping the footprint local.
          </p>
        </Card>
      </CardSwap>
    </div>
  );
}

export default function About() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  return (
    <PageWrapper>
      <motion.div className="fixed left-0 right-0 top-14 z-40 h-px origin-left bg-primary" style={{ scaleX }} />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <section className="grid items-center gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
              <Leaf className="h-3.5 w-3.5" />
              About Green Code
            </div>
            <h1 className="mb-5 font-mono text-3xl font-bold leading-tight text-foreground sm:text-5xl md:text-6xl">
              Sustainable software should feel measurable.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Green Code was built to help developers see the carbon cost of inefficient Python and turn that feedback
              into better habits, cleaner projects, and shareable proof.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.65 }}
          >
            <AboutCardStack />
          </motion.div>
        </section>

        <section className="grid grid-cols-2 gap-4 py-14 md:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.08 }}
              className="rounded-lg border border-primary/15 bg-[#061406]/70 p-5 text-center backdrop-blur"
            >
              <div className="mb-2 font-mono text-3xl font-bold text-primary">{s.value}</div>
              <div className="font-mono text-xs leading-relaxed text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </section>

        <section className="grid gap-5 py-14 md:grid-cols-3">
          {mission.map(({ Icon, ...item }, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-lg border border-primary/15 bg-[#061406]/70 p-6 backdrop-blur"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mb-3 font-mono text-lg font-bold text-foreground">{item.title}</h2>
              <p className="text-sm leading-7 text-muted-foreground">{item.text}</p>
            </motion.div>
          ))}
        </section>

        <section className="py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center"
          >
            <h2 className="mb-3 font-mono text-3xl font-bold text-foreground">What the auditor looks for</h2>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground">
              The rules are practical: fewer wasted cycles, less memory churn, clearer code, and better learning loops.
            </p>
          </motion.div>

          <div className="space-y-3">
            {rules.map(({ Icon, ...rule }, i) => (
              <motion.div
                key={rule.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -28 : 28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-70px" }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                className="group flex items-start gap-4 rounded-lg border border-primary/15 bg-[#061406]/70 p-5 backdrop-blur transition hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-bold text-foreground">{rule.title}</span>
                    <span
                      className="rounded px-2 py-0.5 font-mono text-xs font-bold"
                      style={{
                        color: rule.penalty === "bonus" ? "#00e887" : "#e05c5c",
                        background: rule.penalty === "bonus" ? "#00e88715" : "#e05c5c15",
                      }}
                    >
                      {rule.penalty}
                    </span>
                  </div>
                  <p className="font-mono text-xs leading-relaxed text-muted-foreground">{rule.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="my-14 rounded-lg border border-primary/25 bg-primary/10 p-8 text-center backdrop-blur"
        >
          <div className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-primary">Powered by BrowserPod</div>
          <h2 className="mb-4 font-mono text-3xl font-bold text-foreground">A live server without deploying one</h2>
          <p className="mx-auto mb-7 max-w-2xl text-sm leading-7 text-muted-foreground">
            Badge and certificate pages are generated from a Node.js server running through WebAssembly in your browser.
            That keeps demos shareable while staying aligned with the low-footprint philosophy.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/audit" className="rounded-full bg-primary px-7 py-3 font-mono text-sm font-semibold text-primary-foreground">
              Try the Auditor
            </Link>
            <Link
              to="/learn"
              className="rounded-full border border-primary/30 px-7 py-3 font-mono text-sm font-semibold text-primary"
            >
              Start Learning
            </Link>
          </div>
        </motion.section>
      </div>
    </PageWrapper>
  );
}
