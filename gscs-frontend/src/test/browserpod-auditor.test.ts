import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { analyzeCode } from "@/lib/auditor";

const require = createRequire(import.meta.url);
const podEngine = require("../../public/pod-server/auditor-engine.cjs") as {
  analyzeCode: typeof analyzeCode;
};

const inefficientCode = `import time

def process_data(items):
    result = ""
    for i in range(len(items)):
        for j in range(len(items)):
            if items[i] == items[j]:
                result = result + str(items[i])
    temp = 42
    time.sleep(0.1)
    return result
`;

const cleanerCode = `from math import sqrt

def magnitudes(points: list[tuple[int, int]]) -> list[float]:
    return [sqrt(x * x + y * y) for x, y in points]
`;

describe("BrowserPod auditor engine", () => {
  it("matches the TypeScript auditor for penalties and bonuses", () => {
    for (const source of [inefficientCode, cleanerCode]) {
      const local = analyzeCode(source);
      const pod = podEngine.analyzeCode(source);

      expect(pod.score).toBe(local.score);
      expect(pod.grade).toBe(local.grade);
      expect(pod.certification).toBe(local.certification);
      expect(pod.total_penalty).toBe(local.total_penalty);
      expect(pod.total_bonus).toBe(local.total_bonus);
      expect(pod.issues.map((issue) => issue.rule_id)).toEqual(
        local.issues.map((issue) => issue.rule_id)
      );
    }
  });
});
