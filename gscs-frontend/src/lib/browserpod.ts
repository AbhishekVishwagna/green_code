/**
 * src/lib/browserpod.ts
 * Follows the BrowserPod Express.js docs pattern exactly:
 * https://browserpod.io/docs/getting-started/expressjs
 */
import { BrowserPod } from "@leaningtech/browserpod";

const BP_API_KEY = import.meta.env.VITE_BP_APIKEY as string;

export type PodState = "idle" | "booting" | "ready" | "error";
let _state:     PodState      = "idle";
let _portalUrl: string | null = null;
let _errMsg:    string | null = null;
let _service:   PodService | null = null;
let _booting:   Promise<PodService> | null = null;

type Listener = (s: PodState, url: string | null, err: string | null) => void;
const _listeners = new Set<Listener>();

export function subscribePodState(fn: Listener): () => void {
  _listeners.add(fn);
  fn(_state, _portalUrl, _errMsg);
  return () => _listeners.delete(fn);
}

function _emit(s: PodState, url?: string, err?: string) {
  _state = s;
  if (url !== undefined) _portalUrl = url;
  if (err !== undefined) _errMsg    = err;
  _listeners.forEach(fn => fn(_state, _portalUrl, _errMsg));
}

export interface PodService {
  portalUrl: string;
  getBadgeUrl(r: {
    score: number; grade: string; credits: number;
    co2_saved_grams: number; certification: string;
  }): Promise<string>;
  getCertificateUrl(p: {
    projectName: string; summary: object;
    top_issues: object[]; files: object[];
  }): Promise<string>;
}

export async function bootWithTerminal(el: HTMLElement): Promise<PodService> {
  if (_service) return _service;
  if (_booting) return _booting;
  _emit("booting");
  _booting = _boot(el).then(
    svc => { _service = svc; _booting = null; return svc; },
    err => { _booting = null; _emit("error", undefined, (err as Error).message); throw err; }
  );
  return _booting;
}

export async function getPodService(): Promise<PodService> {
  if (_service) return _service;
  if (_booting) return _booting;
  return bootWithTerminal(document.createElement("div"));
}

export function prewarmPod() {
  getPodService().catch(e => console.warn("[GSCS]", (e as Error).message));
}

// ── Copy helper — matches docs utils.js exactly ───────────────────────────────
async function copyFile(pod: InstanceType<typeof BrowserPod>, path: string) {
  const f    = await pod.createFile("/" + path, "binary");
  // Use absolute path from root for better compatibility with both dev and prod
  const url = "/" + path + "?v=" + Date.now();
  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) {
    throw new Error(`Could not fetch: ${url} (${resp.status} ${resp.statusText})`);
  }
  const buf  = await resp.arrayBuffer();
  await f.write(buf);
  await f.close();
}

// ── Boot — follows docs src/main.js pattern exactly ──────────────────────────
async function _boot(termEl: HTMLElement): Promise<PodService> {
  if (!BP_API_KEY) {
    throw new Error("VITE_BP_APIKEY not set — add to .env.local and restart.");
  }

  // 1. Boot the pod
  const pod = await BrowserPod.boot({ apiKey: BP_API_KEY });

  // 2. Create terminal (output streams into the UI element)
  const terminal = await pod.createDefaultTerminal(termEl);

  // 3. Register portal callback FIRST, then start setup — docs pattern
  const portalUrl = await new Promise<string>((resolve, reject) => {
    let setupComplete = false;
    let portalDetected = false;

    pod.onPortal(({ url }: { url: string }) => {
      portalDetected = true;
      _emit("ready", url);
      resolve(url);
    });

    // Setup timeout — if pod doesn't start within 60 seconds, fail
    const timeoutId = setTimeout(() => {
      if (!portalDetected && !setupComplete) {
        reject(new Error("Pod setup timeout — server did not start within 60 seconds"));
      }
    }, 60000);

    // Run setup — if it fails, reject so we don't hang forever
    (async () => {
      try {
        // 4. Copy files into pod (docs: createDirectory + copyFile)
        await pod.createDirectory("/pod-server");
        await copyFile(pod, "pod-server/server.js");
        // auditor-engine.cjs is optional — server has a fallback if it fails
        try {
          await copyFile(pod, "pod-server/auditor-engine.cjs");
        } catch (e) {
          console.warn("[GSCS] auditor-engine.cjs copy failed (non-fatal):", (e as Error).message);
        }
        await copyFile(pod, "pod-server/package.json");

        // 5. Install express
        await pod.run("npm", ["install"], {
          cwd:      "/pod-server",
          echo:     true,
          terminal: terminal,
        });

        // 6. Start server — triggers onPortal when app.listen(3000) fires
        // Note: this will run indefinitely, so we don't await for completion
        pod.run("node", ["server.js"], {
          cwd:      "/pod-server",
          echo:     true,
          terminal: terminal,
        }).catch(err => {
          if (!portalDetected) {
            reject(new Error(`Server startup failed: ${(err as Error).message}`));
          }
        });
      } catch (err) {
        setupComplete = true;
        clearTimeout(timeoutId);
        reject(err);
      }
    })();
  });

  return {
    portalUrl,
    async getBadgeUrl(r) {
      const res = await fetch(portalUrl + "/badge", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(r),
      });
      if (!res.ok) throw new Error("Badge failed: " + res.status);
      const d = await res.json();
      return portalUrl + d.badge_url;
    },
    async getCertificateUrl(p) {
      const res = await fetch(portalUrl + "/certificate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(p),
      });
      if (!res.ok) throw new Error("Certificate failed: " + res.status);
      const d = await res.json();
      return portalUrl + d.cert_url;
    },
  };
}
