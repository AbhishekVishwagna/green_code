"""
auditor.py — GSCS Core AST Analysis Engine
Parses Python source code and detects computational inefficiencies
that directly contribute to unnecessary carbon emissions.
"""

import ast
import textwrap
from dataclasses import dataclass, field
from typing import Optional


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

@dataclass
class Issue:
    rule_id: str
    issue: str
    impact: str          # "High" | "Medium" | "Low"
    penalty: int         # points deducted from score (0–100 scale)
    line: Optional[int]
    suggestion: str
    co2_weight: float    # grams CO2 equivalent per occurrence (simplified model)


@dataclass
class AuditResult:
    issues: list[Issue] = field(default_factory=list)
    parse_error: Optional[str] = None


# ---------------------------------------------------------------------------
# Rule definitions  (rule_id, display name, impact, penalty, co2_weight)
# ---------------------------------------------------------------------------

RULES = {
    "nested_loop":        ("Nested loop detected",          "High",   20, 0.50),
    "triple_nested_loop": ("Triple-nested loop detected",   "High",   35, 1.00),
    "unused_variable":    ("Unused variable assigned",      "Low",     5, 0.05),
    "unused_import":      ("Import never referenced",       "Medium",  8, 0.10),
    "heavy_import":       ("Heavy library imported",        "Medium", 10, 0.20),
    "list_membership":    ("List used for membership test", "Medium", 12, 0.15),
    "dead_function":      ("Dead function (never called)",  "Low",     5, 0.05),
    "repeated_call":      ("Repeated identical call in loop","Medium", 15, 0.20),
    "string_concat_loop": ("String concat inside loop",     "High",   18, 0.30),
    "global_in_loop":     ("Global lookup inside loop",     "Low",     7, 0.08),
}

# Libraries known to have large memory/compute footprints
HEAVY_IMPORTS = {
    "tensorflow", "torch", "keras", "sklearn", "cv2",
    "matplotlib", "seaborn", "plotly", "bokeh",
    "pyspark", "dask", "ray",
}


# ---------------------------------------------------------------------------
# Auditor
# ---------------------------------------------------------------------------

class CodeAuditor(ast.NodeVisitor):
    """
    Walks the AST and collects Issue instances for every rule violation found.
    """

    def __init__(self, source: str):
        self.source = source
        self.issues: list[Issue] = []
        self._imports: dict[str, int] = {}        # name -> lineno
        self._assigned: dict[str, int] = {}       # name -> lineno
        self._used_names: set[str] = set()
        self._called_functions: set[str] = set()
        self._defined_functions: dict[str, int] = {}  # name -> lineno
        self._loop_depth = 0

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _add(self, rule_id: str, line: Optional[int] = None, extra: str = ""):
        name, impact, penalty, co2 = RULES[rule_id]
        display = f"{name}{': ' + extra if extra else ''}"
        suggestions = {
            "nested_loop": (
                "Flatten nested loops using itertools.product() or restructure "
                "with a dictionary/set lookup. O(n²) loops scale very poorly."
            ),
            "triple_nested_loop": (
                "Triple-nested loops are O(n³). Refactor using vectorised operations "
                "(numpy), hash maps, or algorithmic redesign."
            ),
            "unused_variable": (
                f"Remove the unused variable '{extra}' — it wastes memory "
                "allocation and makes the code harder to read."
            ),
            "unused_import": (
                f"Remove 'import {extra}' — unused imports increase load time "
                "and memory overhead for every process that runs this module."
            ),
            "heavy_import": (
                f"'{extra}' is a large library. Import only what you need "
                "(e.g. 'from sklearn.linear_model import LinearRegression') "
                "to reduce startup time and memory."
            ),
            "list_membership": (
                "Replace list membership checks (x in list) with a set "
                "(x in set_). Lists are O(n); sets are O(1), saving CPU cycles."
            ),
            "dead_function": (
                f"Function '{extra}' is defined but never called. "
                "Remove it to reduce module load overhead."
            ),
            "repeated_call": (
                "Cache the result of repeated function calls outside the loop "
                "using a local variable. Each redundant call wastes CPU time."
            ),
            "string_concat_loop": (
                "Avoid string += inside loops — each concatenation creates a new "
                "string object. Use a list and ''.join() after the loop instead."
            ),
            "global_in_loop": (
                f"Resolve global '{extra}' to a local variable before the loop. "
                "Global lookups (LOAD_GLOBAL) are slower than local lookups (LOAD_FAST)."
            ),
        }
        self.issues.append(Issue(
            rule_id=rule_id,
            issue=display,
            impact=impact,
            penalty=penalty,
            line=line,
            suggestion=suggestions.get(rule_id, "Review and optimise this pattern."),
            co2_weight=co2,
        ))

    # ------------------------------------------------------------------
    # AST visitors
    # ------------------------------------------------------------------

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            name = alias.asname or alias.name.split(".")[0]
            self._imports[name] = node.lineno
            # Check for heavy libraries
            base = alias.name.split(".")[0]
            if base in HEAVY_IMPORTS:
                self._add("heavy_import", node.lineno, alias.name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        module = node.module or ""
        base = module.split(".")[0]
        for alias in node.names:
            name = alias.asname or alias.name
            self._imports[name] = node.lineno
        if base in HEAVY_IMPORTS:
            self._add("heavy_import", node.lineno, module)
        self.generic_visit(node)

    def visit_Name(self, node: ast.Name):
        if isinstance(node.ctx, ast.Load):
            self._used_names.add(node.id)
        self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Name):
                self._assigned[target.id] = node.lineno
        self.generic_visit(node)

    def visit_AugAssign(self, node: ast.AugAssign):
        # Detect string += inside loop
        if self._loop_depth > 0 and isinstance(node.op, ast.Add):
            if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                self._add("string_concat_loop", node.lineno)
            # Also catch name += name patterns where either could be a str
            elif isinstance(node.target, ast.Name):
                self._add("string_concat_loop", node.lineno)
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self._defined_functions[node.name] = node.lineno
        self.generic_visit(node)

    visit_AsyncFunctionDef = visit_FunctionDef

    def visit_Call(self, node: ast.Call):
        if isinstance(node.func, ast.Name):
            self._called_functions.add(node.func.id)
        elif isinstance(node.func, ast.Attribute):
            self._called_functions.add(node.func.attr)
        self.generic_visit(node)

    def visit_For(self, node: ast.For):
        self._loop_depth += 1

        # Check for nested loops
        for child in ast.walk(node):
            if child is node:
                continue
            if isinstance(child, (ast.For, ast.While)):
                # Check for triple-nested
                for grandchild in ast.walk(child):
                    if grandchild is child:
                        continue
                    if isinstance(grandchild, (ast.For, ast.While)):
                        self._add("triple_nested_loop", node.lineno)
                        break
                else:
                    self._add("nested_loop", node.lineno)
                break

        # Check for repeated function calls inside loop body
        call_counts: dict[str, int] = {}
        for child in ast.walk(node):
            if isinstance(child, ast.Call) and isinstance(child.func, ast.Name):
                call_counts[child.func.id] = call_counts.get(child.func.id, 0) + 1
        for fname, count in call_counts.items():
            if count >= 2:
                self._add("repeated_call", node.lineno, fname)

        # Check for list membership tests inside loop
        for child in ast.walk(node):
            if isinstance(child, ast.Compare):
                for op, comp in zip(child.ops, child.comparators):
                    if isinstance(op, ast.In) and isinstance(comp, (ast.List, ast.Name)):
                        self._add("list_membership", node.lineno)

        self.generic_visit(node)
        self._loop_depth -= 1

    visit_While = visit_For

    # ------------------------------------------------------------------
    # Post-walk checks (unused vars/imports/dead code)
    # ------------------------------------------------------------------

    def finalize(self):
        # Unused imports
        for name, lineno in self._imports.items():
            if name not in self._used_names:
                self._add("unused_import", lineno, name)

        # Unused variables (basic: assigned but never loaded)
        for name, lineno in self._assigned.items():
            if name not in self._used_names and not name.startswith("_"):
                self._add("unused_variable", lineno, name)

        # Dead functions (defined but never called)
        for fname, lineno in self._defined_functions.items():
            if fname not in self._called_functions and not fname.startswith("_"):
                self._add("dead_function", lineno, fname)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def audit_code(source: str) -> AuditResult:
    """
    Analyse Python source code and return an AuditResult.

    Usage:
        result = audit_code(open("myfile.py").read())
        for issue in result.issues:
            print(issue.rule_id, issue.line, issue.issue)
    """
    result = AuditResult()

    # Remove common indentation (handles snippets passed as strings)
    source = textwrap.dedent(source)

    try:
        tree = ast.parse(source)
    except SyntaxError as e:
        result.parse_error = f"Syntax error at line {e.lineno}: {e.msg}"
        return result

    auditor = CodeAuditor(source)
    auditor.visit(tree)
    auditor.finalize()

    result.issues = auditor.issues
    return result
