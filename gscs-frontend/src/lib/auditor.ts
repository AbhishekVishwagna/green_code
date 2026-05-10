/**
 * auditor.ts — GSCS Client-Side Code Analysis Engine v2
 *
 * Implements the full Green Coding ruleset with both PENALTIES and BONUSES.
 *
 * Scoring formula:
 *   score = clamp( 100 - sum(penalties) + sum(bonuses), 10, 100 )
 *   Floor = 10  (minimum energy cost of interpreter startup)
 *   Cap   = 100 (cannot exceed perfect)
 *
 * PENALTIES (19 rules) — deduct from score
 * BONUSES   (11 rules) — add back to score for good practices
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type IssueKind = "penalty" | "bonus";

export interface Issue {
  rule_id:    string;
  kind:       IssueKind;
  issue:      string;
  impact:     "High" | "Medium" | "Low" | "Bonus";
  penalty:    number;   // positive = bonus, negative = deduction
  line:       number | null;
  suggestion: string;
}

export interface AuditResult {
  score:                number;
  grade:                "A" | "B" | "C" | "D";
  label:                string;
  credits:              number;
  certification:        string;
  co2_saved_grams:      number;
  co2_saved_per_day_kg: number;
  energy_saved_wh:      number;
  issues:               Issue[];
  penalties:            Issue[];
  bonuses:              Issue[];
  total_penalty:        number;
  total_bonus:          number;
}

// ── Scoring constants ─────────────────────────────────────────────────────────

const GRID_INTENSITY_G_PER_KWH = 490;
const DAILY_EXECUTIONS         = 10_000;
const SCORE_FLOOR              = 10;   // minimum — interpreter startup cost
const SCORE_CAP                = 100;

const HEAVY_LIBS = new Set([
  "tensorflow", "torch", "keras", "sklearn", "cv2",
  "matplotlib", "seaborn", "plotly", "bokeh",
  "pyspark", "dask", "ray",
]);

// Grade A requires score >= 90 (only truly clean, optimised code earns Platinum)
const GRADE_TABLE: Array<[number, "A" | "B" | "C" | "D", number, string, string]> = [
  [90, "A", 10, "Excellent", "Platinum"],
  [70, "B",  5, "Good",      "Gold"    ],
  [50, "C",  2, "Fair",      "Silver"  ],
  [30, "D",  0, "Poor",      "Bronze"  ],
  [ 0, "D",  0, "Poor",      "None"    ],
];

function getGrade(score: number) {
  for (const [min, grade, credits, label, certification] of GRADE_TABLE) {
    if (score >= min) return { grade, credits, label, certification };
  }
  return { grade: "D" as const, credits: 0, label: "Poor", certification: "None" };
}

// ── Line helpers ──────────────────────────────────────────────────────────────

function indent(line: string): number {
  let n = 0;
  for (const ch of line) {
    if (ch === " ") n++;
    else if (ch === "\t") n += 4;
    else break;
  }
  return n;
}

function strip(line: string): string {
  const idx = line.indexOf("#");
  return (idx >= 0 ? line.slice(0, idx) : line).trim();
}

// Count branch points for cyclomatic complexity
function countBranches(source: string): number {
  const branchRe = /\b(if|elif|for|while|except|and|or)\b/g;
  return (source.match(branchRe) ?? []).length + 1;
}

// ── Main analysis function ────────────────────────────────────────────────────

export function analyzeCode(source: string): AuditResult {
  const lines = source.split("\n");

  // Deduplicate by (rule_id, line) so no issue is pushed twice
  const reportedKeys = new Set<string>();
  const issues: Issue[] = [];

  function push(issue: Issue) {
    const key = `${issue.rule_id}:${issue.line ?? "x"}`;
    if (reportedKeys.has(key)) return;
    reportedKeys.add(key);
    issues.push(issue);
  }

  // Per-code-file bonus flags — each bonus fires at most ONCE
  const bonusAwarded = new Set<string>();
  function award(rule_id: string, issue: string, bonus: number, line: number | null, suggestion: string) {
    if (bonusAwarded.has(rule_id)) return;
    bonusAwarded.add(rule_id);
    push({ rule_id, kind: "bonus", issue, impact: "Bonus", penalty: bonus, line, suggestion });
  }

  // ── Pass 0: whole-file feature detection ─────────────────────────────────

  const hasWith    = /\bwith\s+\w/.test(source);
  const hasYield   = /\byield\b/.test(source);
  const hasAnyAll  = /\b(any|all)\s*\(/.test(source);
  const hasFString = /f["']/.test(source);
  const hasTypeHint= /def\s+\w+\s*\([^)]*:\s*\w/.test(source) || /\)\s*->\s*\w/.test(source);
  const hasBuiltins= /\b(map|filter|sum|enumerate|zip)\s*\(/.test(source);
  const hasFromImp = /^from\s+\w[\w.]*\s+import\s+\w/m.test(source);
  const hasInplace = /\.(sort|reverse|update|clear|discard)\s*\(/.test(source);
  const hasSetMem  = /\bin\s+(set\(|\{[^}]*\})/.test(source) || /\bin\s+\w+\s*$/.test(source);
  const cyclomatic  = countBranches(source);
  const hasLenCache = /\b_?\w*len\w*\s*=\s*len\s*\(/.test(source);

  // readlines() / .read() loads entire file into RAM — memory spike
  const hasReadlines = /\.(readlines|read)\s*\(\s*\)/.test(source) && !hasYield;

  // open() without 'with' is unsafe regardless of .close() being present.
  // A crash before .close() leaves the resource open (phantom power draw).
  // BUG FIX: previously exempted when .close() was found — now fires whenever
  // open() is used without a 'with' statement.
  const hasOpenNoWith = /\bopen\s*\(/.test(source) && !hasWith;

  // ── Pass 1: line-by-line — imports, vars, fn defs ────────────────────────

  const imports          = new Map<string, number>();
  const assignedVars     = new Map<string, number>();
  const usedNames        = new Set<string>();
  const definedFunctions = new Map<string, number>();
  const calledFunctions  = new Set<string>();
  let   globalCount      = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw    = lines[i];
    const line   = strip(raw);
    const lineNo = i + 1;
    const ind    = indent(raw);

    // import inside function/loop body (ind > 0)
    if (/^import\s+\w/.test(line) && ind > 0) {
      push({
        rule_id: "import_in_block", kind: "penalty", impact: "Medium", penalty: -15,
        line: lineNo, issue: "Import inside function or block",
        suggestion: "Move imports to the top level — Python caches them there. Importing inside a function forces a module-cache lookup on every call.",
      });
    }

    // top-level imports
    if (/^import\s+([\w,\s]+)/.test(line)) {
      const m = line.match(/^import\s+([\w,\s]+)/)!;
      m[1].split(",").forEach((part) => {
        const name = part.trim().split(/\s+as\s+/).pop()!.trim();
        if (name) imports.set(name, lineNo);
        const base = part.trim().split(/\s+as\s+/)[0].trim().split(".")[0];
        if (HEAVY_LIBS.has(base)) {
          push({
            rule_id: "heavy_import", kind: "penalty", impact: "Medium", penalty: -10,
            line: lineNo, issue: `Heavy library imported: ${base}`,
            suggestion: `'${base}' is large. Use 'from ${base}.x import Y' to load only what you need and cut startup time.`,
          });
        }
      });
    }

    const fromM = line.match(/^from\s+([\w.]+)\s+import\s+(.+)/);
    if (fromM) {
      const module = fromM[1].split(".")[0];
      fromM[2].split(",").forEach((n) => {
        const name = n.trim().split(/\s+as\s+/).pop()!.trim();
        if (name && name !== "*") imports.set(name, lineNo);
      });
      if (HEAVY_LIBS.has(module)) {
        push({
          rule_id: "heavy_import", kind: "penalty", impact: "Medium", penalty: -10,
          line: lineNo, issue: `Heavy library imported: ${module}`,
          suggestion: `'${module}' is large. Import only the specific symbols you need.`,
        });
      }
    }

    // global keyword
    const globalM = line.match(/^global\s+(\w+)/);
    if (globalM) {
      globalCount++;
      push({
        rule_id: `global_keyword:${globalM[1]}`, kind: "penalty", impact: "Low", penalty: -10,
        line: lineNo, issue: `global '${globalM[1]}' bypasses local variable optimisation`,
        suggestion: `Avoid 'global ${globalM[1]}'. Pass it as a parameter or cache it to a local variable. Global lookups (LOAD_GLOBAL) are slower than local lookups (LOAD_FAST).`,
      });
    }

    // function defs
    const defM = line.match(/^def\s+(\w+)\s*\(/);
    if (defM) definedFunctions.set(defM[1], lineNo);

    // function calls
    [...raw.matchAll(/(\w+)\s*\(/g)].forEach((m) => calledFunctions.add(m[1]));

    // variable assignments
    const assignM = line.match(/^([a-zA-Z_]\w*)\s*=/);
    if (assignM && !line.startsWith("def") && !line.startsWith("class") && !assignM[1].startsWith("_")) {
      assignedVars.set(assignM[1], lineNo);
    }

    // all identifiers for unused checks
    [...raw.matchAll(/\b([a-zA-Z_]\w*)\b/g)].forEach((m) => usedNames.add(m[1]));
  }

  // ── Pass 2: loop-based structural analysis ────────────────────────────────

  // BUG-FIX: track middle-loop lines consumed by triple detection
  const skipAsNested = new Set<number>();

  let i = 0;
  while (i < lines.length) {
    const raw    = lines[i];
    const line   = strip(raw);
    const lineNo = i + 1;
    const ind    = indent(raw);

    // ── API polling: while True without sleep ──────────────────────────────
    if (/^while\s+True\s*:/.test(line) || /^while\s+1\s*:/.test(line)) {
      // Check if body contains sleep or time.sleep
      let hasSleep = false;
      for (let j = i + 1; j < lines.length && j < i + 30; j++) {
        const inner    = strip(lines[j]);
        const innerInd = indent(lines[j]);
        if (!inner) continue;
        if (innerInd <= ind) break;
        if (/\bsleep\s*\(/.test(inner)) { hasSleep = true; break; }
      }
      if (!hasSleep) {
        push({
          rule_id: "api_polling", kind: "penalty", impact: "High", penalty: -30,
          line: lineNo, issue: "while True loop without sleep/backoff",
          suggestion: "Add 'time.sleep()' or exponential backoff inside the loop to avoid pegging a CPU core at 100% load during idle polling.",
        });
      }
    }

    // ── Empty loop body (pass only) ────────────────────────────────────────
    if (/^(for|while)\s/.test(line)) {
      let onlyPass = false;
      for (let j = i + 1; j < lines.length && j < i + 10; j++) {
        const inner    = strip(lines[j]);
        const innerInd = indent(lines[j]);
        if (!inner) continue;
        if (innerInd <= ind) break;
        onlyPass = inner === "pass";
        break;
      }
      if (onlyPass) {
        push({
          rule_id: "empty_loop", kind: "penalty", impact: "High", penalty: -50,
          line: lineNo, issue: "Busy-wait loop (body is only 'pass')",
          suggestion: "A loop with only 'pass' pegs a CPU core at 100% doing no useful work. Add a sleep() or redesign as an event-driven pattern.",
        });
      }
    }

    if (/^(for|while)\s/.test(line)) {

      // ── Nested / triple loop ─────────────────────────────────────────────

      if (!skipAsNested.has(lineNo)) {
        let nestedLineNo = -1;
        let foundTriple  = false;

        for (let j = i + 1; j < lines.length && j < i + 80; j++) {
          const inner    = strip(lines[j]);
          const innerInd = indent(lines[j]);
          if (!inner) continue;
          if (innerInd <= ind) break;
          if (/^(for|while)\s/.test(inner)) {
            nestedLineNo = j + 1;
            for (let k = j + 1; k < lines.length && k < j + 80; k++) {
              const deep    = strip(lines[k]);
              const deepInd = indent(lines[k]);
              if (!deep) continue;
              if (deepInd <= innerInd) break;
              if (/^(for|while)\s/.test(deep)) { foundTriple = true; break; }
            }
            break;
          }
        }

        if (foundTriple) {
          push({
            rule_id: "triple_nested_loop", kind: "penalty", impact: "High", penalty: -50,
            line: lineNo, issue: "Triple-nested loop — O(n³) catastrophic energy sink",
            suggestion: "O(n³) loops are unsustainable. Refactor with numpy vectorisation, hash maps, or a fundamentally different algorithm.",
          });
          if (nestedLineNo > 0) skipAsNested.add(nestedLineNo);
        } else if (nestedLineNo > 0) {
          push({
            rule_id: "nested_loop", kind: "penalty", impact: "High", penalty: -35,
            line: lineNo, issue: "Nested loop — O(n²) quadratic growth penalty",
            suggestion: "Nested loops over the same data are an O(n²) energy sink. Restructure with a dict/set lookup, itertools.product(), or vectorised operations.",
          });
        }
      }

      // ── String concat inside loop ────────────────────────────────────────
      for (let j = i + 1; j < lines.length && j < i + 40; j++) {
        const inner    = strip(lines[j]);
        const innerInd = indent(lines[j]);
        if (!inner) continue;
        if (innerInd <= ind) break;
        if (
          /\w+\s*\+=\s*(str\(|f?["'])/.test(inner) ||
          /\w+\s*=\s*\w+\s*\+\s*(str\(|f?["'])/.test(inner)
        ) {
          push({
            rule_id: "string_concat_loop", kind: "penalty", impact: "High", penalty: -30,
            line: j + 1, issue: "String concatenation inside loop",
            suggestion: "Each '+=' creates a new string object. Collect items in a list then call ''.join(parts) once after the loop.",
          });
          // If join() is not used anywhere in the file, add an extra penalty for
          // missing the built-in native optimisation (implemented in C, far faster)
          if (!source.includes(".join(")) {
            push({
              rule_id: "no_join_optimization", kind: "penalty", impact: "Medium", penalty: -15,
              line: j + 1, issue: "Manual string loop — ''.join(list) not used",
              suggestion: "Replace the entire loop with: return ', '.join(str(item) for item in data_list). Python's join() is implemented in optimised C and avoids all intermediate string allocations.",
            });
          }
          break;
        }
      }

      // ── List membership test inside loop ─────────────────────────────────
      for (let j = i + 1; j < lines.length && j < i + 40; j++) {
        const inner    = strip(lines[j]);
        const innerInd = indent(lines[j]);
        if (!inner) continue;
        if (innerInd <= ind) break;
        if (/\bin\s+\[/.test(inner)) {
          push({
            rule_id: "list_membership", kind: "penalty", impact: "Medium", penalty: -12,
            line: j + 1, issue: "List used for membership test inside loop",
            suggestion: "x in [list] is O(n) per check. Convert to a set before the loop: allowed = set(allowed_list). Then x in allowed is O(1).",
          });
          break;
        }
      }

      // ── Potential O(n) membership test with variable (not literal list) ────
      // Catches: if x (not) in variable_name — the variable could be a list,
      // making this an O(n) lookup on every iteration.
      // Excludes: in set(...), in {...}, in [...] (literal) — those are fine or handled above.
      for (let j = i + 1; j < lines.length && j < i + 40; j++) {
        const inner    = strip(lines[j]);
        const innerInd = indent(lines[j]);
        if (!inner) continue;
        if (innerInd <= ind) break;
        // Only match inside an if/elif condition, not for-loop iterators
        if (
          /\bif\b.*\bnot\s+in\s+([a-zA-Z_]\w*)\b(?!\s*[\(\[\{])/.test(inner) ||
          /\bif\b.+\bin\s+([a-zA-Z_]\w*)\b(?!\s*[\(\[\{])/.test(inner)
        ) {
          push({
            rule_id: "potential_list_membership", kind: "penalty", impact: "High", penalty: -30,
            line: j + 1, issue: "Potential O(n) membership test — variable may be a list",
            suggestion: "If the variable is a list, convert it to a set before the loop: blacklist_set = set(blacklist). Then 'in blacklist_set' is O(1) instead of O(n), saving massive CPU cycles at scale.",
          });
          break;
        }
      }

      // ── Loop-invariant computation (len() etc. inside loop) ───────────────
      for (let j = i + 1; j < lines.length && j < i + 40; j++) {
        const inner    = strip(lines[j]);
        const innerInd = indent(lines[j]);
        if (!inner) continue;
        if (innerInd <= ind) break;
        // Detect len(), range(len()), or other calls that don't change
        if (/\brange\s*\(\s*len\s*\(/.test(inner) || /[^=]\blen\s*\(\w+\)/.test(inner)) {
          push({
            rule_id: "loop_invariant", kind: "penalty", impact: "Medium", penalty: -15,
            line: j + 1, issue: "Loop-invariant len() call inside loop body",
            suggestion: "Cache len(data) in a variable before the loop: n = len(data). Recalculating it every iteration wastes CPU cycles on unchanged data.",
          });
          break;
        }
      }

      // ── Loop-invariant constant expression (var = number op number) ─────────
      // Catches: multiplier = 10 * 2 inside a loop — the result never changes,
      // so the CPU recomputes it wastefully on every iteration.
      for (let j = i + 1; j < lines.length && j < i + 40; j++) {
        const inner    = strip(lines[j]);
        const innerInd = indent(lines[j]);
        if (!inner) continue;
        if (innerInd <= ind) break;
        // Match: identifier = number [+-*/] number  (pure constant expression)
        if (/^[a-zA-Z_]\w*\s*=\s*\d+(\.\d+)?\s*[+\-\*\/]\s*\d+(\.\d+)?$/.test(inner)) {
          push({
            rule_id: "loop_invariant_const", kind: "penalty", impact: "Medium", penalty: -15,
            line: j + 1, issue: "Loop-invariant constant computation inside loop",
            suggestion: "This value never changes — hoist it above the loop. The CPU recalculates the same result on every iteration, burning energy on redundant arithmetic.",
          });
          break;
        }
      }

      // ── I/O inside loop (print/requests) ─────────────────────────────────
      for (let j = i + 1; j < lines.length && j < i + 40; j++) {
        const inner    = strip(lines[j]);
        const innerInd = indent(lines[j]);
        if (!inner) continue;
        if (innerInd <= ind) break;
        if (/\bprint\s*\(/.test(inner) || /\brequests\.(get|post|put|delete|patch)\s*\(/.test(inner)) {
          push({
            rule_id: "io_in_loop", kind: "penalty", impact: "High", penalty: -25,
            line: j + 1, issue: "I/O operation (print/network request) inside loop",
            suggestion: "I/O inside a hot loop forces the CPU into a high-power busy-wait state. Batch output with a list and print once, or buffer network calls.",
          });
          break;
        }
      }

      // ── try/except inside loop (exception-as-flow-control) ───────────────
      for (let j = i + 1; j < lines.length && j < i + 40; j++) {
        const inner    = strip(lines[j]);
        const innerInd = indent(lines[j]);
        if (!inner) continue;
        if (innerInd <= ind) break;
        if (/^try\s*:/.test(inner)) {
          push({
            rule_id: "exception_flow", kind: "penalty", impact: "Medium", penalty: -10,
            line: j + 1, issue: "try/except inside loop — exception as flow control",
            suggestion: "Exception handling inside loops is high overhead. Use 'if key in dict' or explicit checks instead of relying on try/except for normal control flow.",
          });
          break;
        }
      }

      // ── Redundant type casting inside loop ───────────────────────────────
      for (let j = i + 1; j < lines.length && j < i + 40; j++) {
        const inner    = strip(lines[j]);
        const innerInd = indent(lines[j]);
        if (!inner) continue;
        if (innerInd <= ind) break;
        if (/\b(int|float|str|bool)\s*\(\w+\)/.test(inner)) {
          push({
            rule_id: "redundant_typecast", kind: "penalty", impact: "Medium", penalty: -15,
            line: j + 1, issue: "Type cast inside loop",
            suggestion: "Convert types once outside the loop. Casting inside forces the type system to run on every iteration.",
          });
          break;
        }
      }

      // ── Repeated deep attribute access in loop ────────────────────────────
      const attrCounts = new Map<string, number>();
      for (let j = i + 1; j < lines.length && j < i + 40; j++) {
        const inner    = strip(lines[j]);
        const innerInd = indent(lines[j]);
        if (!inner) continue;
        if (innerInd <= ind) break;
        for (const [, attr] of inner.matchAll(/\b(\w+\.\w+\.\w+)\b/g)) {
          attrCounts.set(attr, (attrCounts.get(attr) ?? 0) + 1);
        }
      }
      for (const [attr, count] of attrCounts) {
        if (count >= 2) {
          push({
            rule_id: `attribute_lookup:${attr}`, kind: "penalty", impact: "Low", penalty: -10,
            line: lineNo, issue: `Repeated attribute lookup '${attr}' in loop`,
            suggestion: `Cache '${attr}' to a local variable before the loop. Each deep attribute access (LOAD_ATTR × 2) costs multiple dictionary hits.`,
          });
        }
      }

      // ── Repeated identical calls inside loop ─────────────────────────────
      const callCounts = new Map<string, number>();
      for (let j = i + 1; j < lines.length && j < i + 40; j++) {
        const inner    = strip(lines[j]);
        const innerInd = indent(lines[j]);
        if (!inner) continue;
        if (innerInd <= ind) break;
        for (const [, fn] of inner.matchAll(/(\w+)\s*\(/g)) {
          callCounts.set(fn, (callCounts.get(fn) ?? 0) + 1);
        }
      }
      for (const [fn, count] of callCounts) {
        if (count >= 2 && !["print", "int", "str", "float", "bool", "len"].includes(fn)) {
          push({
            rule_id: `repeated_call:${fn}`, kind: "penalty", impact: "Medium", penalty: -15,
            line: lineNo, issue: `Repeated call to ${fn}() inside loop`,
            suggestion: `Cache the result of ${fn}() in a variable before the loop — redundant calls waste CPU on identical computation.`,
          });
        }
      }

      // ── List growth in loop (.append without pre-allocation) ─────────────
      for (let j = i + 1; j < lines.length && j < i + 40; j++) {
        const inner    = strip(lines[j]);
        const innerInd = indent(lines[j]);
        if (!inner) continue;
        if (innerInd <= ind) break;
        if (/\.append\s*\(/.test(inner)) {
          push({
            rule_id: "list_growth_loop", kind: "penalty", impact: "Low", penalty: -10,
            line: j + 1, issue: "List.append() inside loop — repeated memory reallocation",
            suggestion: "If the final size is known, pre-allocate: result = [None] * n. Repeated append() triggers costly memory reallocation as the backing array grows.",
          });
          break;
        }
      }
    }

    i++;
  }

  // ── Pass 3: post-collection — unused imports/vars/dead fns ───────────────

  imports.forEach((lineNo, name) => {
    const occ = [...source.matchAll(new RegExp(`\\b${name}\\b`, "g"))].length;
    if (occ <= 1) {
      push({
        rule_id: "unused_import", kind: "penalty", impact: "Medium", penalty: -8,
        line: lineNo, issue: `Unused import: ${name}`,
        suggestion: `Remove 'import ${name}' — unused imports increase load time and memory for every process that runs this module.`,
      });
    }
  });

  assignedVars.forEach((lineNo, name) => {
    if (name === "_" || name.startsWith("__")) return;
    const occ = [...source.matchAll(new RegExp(`\\b${name}\\b`, "g"))].length;
    if (occ <= 1) {
      push({
        rule_id: "dead_code", kind: "penalty", impact: "Low", penalty: -15,
        line: lineNo, issue: `Dead code: variable '${name}' assigned but never used`,
        suggestion: `Remove '${name}' — unused assignments waste memory allocation and parsing energy, and signal unreachable code paths.`,
      });
    }
  });

  definedFunctions.forEach((lineNo, name) => {
    if (name.startsWith("_") || name === "main") return;
    if (!calledFunctions.has(name)) {
      push({
        rule_id: "dead_function", kind: "penalty", impact: "Low", penalty: -5,
        line: lineNo, issue: `Dead function: ${name}() defined but never called`,
        suggestion: `Remove '${name}' — dead functions increase module load overhead on every import.`,
      });
    }
  });

  if (hasReadlines) {
    push({
      rule_id: "readlines_memory_spike", kind: "penalty", impact: "High", penalty: -25,
      line: null, issue: "file.readlines() loads entire file into RAM",
      suggestion: "readlines() forces the OS to read the whole file into memory at once — a massive energy spike for large files. Instead, iterate line by line: 'for line in file:' uses O(1) memory regardless of file size.",
    });
  }

  if (hasOpenNoWith) {
    push({
      rule_id: "unclosed_resource", kind: "penalty", impact: "High", penalty: -30,
      line: null, issue: "open() used without 'with' statement or explicit .close()",
      suggestion: "Use 'with open(...) as f:' to guarantee the file is closed immediately, eliminating phantom power draw from leaked file descriptors.",
    });
  }

  // ── Pass 4: award bonuses for good practices ──────────────────────────────

  // NOTE: context_manager bonus removed — 'with' is correct baseline behaviour,
  // not an exceptional optimisation worthy of offsetting real penalties.

  if (hasYield) {
    award("lazy_loading",
      "Generator / lazy loading (yield) detected",
      +20, null,
      "Outstanding. Generators yield items on demand rather than loading everything into RAM, preventing massive energy spikes in the memory controller.");
  }

  if (hasAnyAll) {
    award("short_circuit",
      "Short-circuit evaluation: any() or all() detected",
      +10, null,
      "any()/all() terminates as soon as the condition is satisfied — no wasted iterations, no wasted power draw.");
  }

  if (hasFromImp) {
    award("selective_import",
      "Selective namespace import: 'from module import func'",
      +10, null,
      "'from x import y' loads only what you need, reducing namespace resolution overhead and interpreter memory footprint.");
  }

  if (hasBuiltins) {
    award("builtin_func",
      "Built-in functions used: map/filter/sum/enumerate/zip",
      +10, null,
      "Built-in functions are implemented in optimised C. Using them instead of manual loops reduces interpreter overhead significantly.");
  }

  if (hasInplace) {
    award("inplace_mod",
      "In-place modification: .sort()/.reverse()/.update() detected",
      +10, null,
      "In-place operations avoid allocating new objects. Less allocation = less GC pressure = less energy spent on memory management.");
  }

  if (hasFString) {
    award("fstring",
      "f-strings used for string formatting",
      +5, null,
      "f-strings are compiled at parse time — the most energy-efficient string interpolation method in Python.");
  }

  if (hasTypeHint) {
    award("type_hints",
      "Type annotations detected",
      +5, null,
      "Type hints enable static analysis and allow optimised runtimes (PyPy, Cython) to generate more efficient code paths.");
  }

  if (hasSetMem) {
    award("set_lookup",
      "Constant-time set/dict membership check detected",
      +15, null,
      "O(1) hash-based lookups vs O(n) list scans. Using sets for membership tests is one of the highest-impact green coding practices.");
  }

  if (hasLenCache) {
    award("local_var_cache",
      "Global function cached to local variable (e.g. _len = len)",
      +5, null,
      "Caching builtins to local variables before loops avoids repeated LOAD_GLOBAL bytecode — a small but measurable optimisation in tight loops.");
  }

  // Only award if no High-impact penalties exist — a nested loop with 3 branches
  // should not earn a complexity bonus.
  // Suppress complexity bonus if code has ANY penalty issues.
  // Even Medium/Low penalties mean the code isn't clean enough to earn this.
  const hasPenalties = issues.some(iss => iss.kind === "penalty");
  if (cyclomatic <= 10 && !hasPenalties) {
    award("low_complexity",
      `Low cyclomatic complexity (${cyclomatic} branch points)`,
      +10, null,
      "Low-complexity code is easier for the CPU branch predictor to optimise, reducing misprediction penalties and wasted pipeline flushes.");
  }

  // ── Final scoring ─────────────────────────────────────────────────────────

  const penalties_ = issues.filter(iss => iss.kind === "penalty");
  const bonuses_   = issues.filter(iss => iss.kind === "bonus");
  const totalPen   = penalties_.reduce((s, iss) => s + iss.penalty, 0); // negative sum
  const totalBonus = bonuses_.reduce((s, iss) => s + iss.penalty, 0);  // positive sum

  const rawScore = 100 + totalPen + totalBonus;
  const score    = Math.max(SCORE_FLOOR, Math.min(SCORE_CAP, rawScore));

  const { grade, credits, label, certification } = getGrade(score);

  const co2WeightMap: Record<string, number> = {
    nested_loop: 0.50, triple_nested_loop: 1.20, dead_code: 0.05,
    unused_import: 0.10, heavy_import: 0.20, list_membership: 0.15,
    dead_function: 0.05, repeated_call: 0.20, string_concat_loop: 0.30,
    global_keyword: 0.08, io_in_loop: 0.40, api_polling: 0.80,
    readlines_memory_spike: 0.60, list_growth_loop: 0.08, no_join_optimization: 0.25,
    empty_loop: 1.50, loop_invariant: 0.12, redundant_typecast: 0.10,
    import_in_block: 0.08, attribute_lookup: 0.06, exception_flow: 0.10,
    unclosed_resource: 0.25,
  };

  // CO2 savings come from penalties avoided AND bonuses earned
  const penaltyRuleIds = penalties_.map(p => p.rule_id.split(":")[0]);
  const co2PerExec = penaltyRuleIds.reduce((s, id) => s + (co2WeightMap[id] ?? 0.05), 0);
  const energyWh      = co2PerExec / (GRID_INTENSITY_G_PER_KWH / 1000);
  const co2PerDayKg   = (co2PerExec * DAILY_EXECUTIONS) / 1000;

  return {
    score, grade, label, credits, certification,
    co2_saved_grams:     Math.round(co2PerExec * 1000) / 1000,
    co2_saved_per_day_kg: Math.round(co2PerDayKg * 10000) / 10000,
    energy_saved_wh:     Math.round(energyWh * 1000000) / 1000000,
    issues,
    penalties: penalties_,
    bonuses:   bonuses_,
    total_penalty: totalPen,
    total_bonus:   totalBonus,
  };
}