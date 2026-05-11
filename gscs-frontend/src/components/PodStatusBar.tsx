import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bootWithTerminal, subscribePodState, type PodState } from "@/lib/browserpod";

export default function PodStatusBar() {
  const termRef  = useRef<HTMLDivElement>(null);
  const booted   = useRef(false);
  const [state,     setState]     = useState<PodState>("idle");
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [copied,    setCopied]    = useState(false);

  useEffect(() => {
    return subscribePodState((s, url, err) => {
      setState(s);
      if (url) setPortalUrl(url);
      if (err) setError(err);
    });
  }, []);

  useEffect(() => {
    if (booted.current || !termRef.current) return;
    booted.current = true;
    bootWithTerminal(termRef.current).catch(() => {});
  }, []);

  const handleCopy = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const dotColor = {
    idle:    "#4a7a4a",
    booting: "#f5c542",
    ready:   "#00e887",
    error:   "#e05c5c",
  }[state];

  const statusLabel = {
    idle:    "Initialising…",
    booting: "Booting pod…",
    ready:   "Pod Server Running",
    error:   error ?? "Pod failed to start",
  }[state];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{
        margin: "40px auto",
        maxWidth: 860,
        width: "calc(100% - 48px)",
        borderRadius: 14,
        border: `1px solid ${state === "ready" ? "#00e88730" : "#1a3a1a"}`,
        background: "#0a1a0a",
        fontFamily: "'JetBrains Mono', monospace",
        overflow: "hidden",
        transition: "border-color 0.4s",
      }}
    >
      {/* ── Status bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: "#0f1a0f",
        }}
      >
        {/* Left — dot + label */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: dotColor,
              boxShadow: state === "ready"   ? `0 0 8px ${dotColor}` :
                         state === "booting" ? `0 0 5px ${dotColor}` : "none",
              transition: "all 0.4s",
            }}
          />
          <span style={{ fontSize: 11, color: "#7bd4a0", letterSpacing: 1 }}>
            BROWSERPOD — {statusLabel.toUpperCase()}
          </span>
        </div>

        {/* Right — portal URL + copy */}
        {portalUrl && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                color: "#00e887",
                textDecoration: "none",
                maxWidth: 320,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {portalUrl}
            </a>
            <button
              onClick={handleCopy}
              style={{
                padding: "4px 12px",
                background: copied ? "#00e88720" : "transparent",
                border: `1px solid ${copied ? "#00e887" : "#1a3a1a"}`,
                borderRadius: 6,
                color: copied ? "#00e887" : "#4a7a4a",
                fontFamily: "inherit",
                fontSize: 10,
                cursor: "pointer",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
            >
              {copied ? "✓ Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {/* ── Info message ── */}
      <AnimatePresence>
        {state === "ready" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              padding: "14px 20px",
              borderTop: "1px solid #1a3a1a",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>🌱</span>
            <div>
              <p style={{ fontSize: 12, color: "#a0c8a0", lineHeight: 1.7, margin: 0 }}>
                This is an <strong style={{ color: "#00e887" }}>independently running live page</strong> powered
                by BrowserPod — a full Node.js server executing entirely inside your browser
                via WebAssembly. No cloud server, no backend, no terminal needed.
                Feel free to access and share your portal link above.
              </p>
              <p style={{ fontSize: 10, color: "#4a7a4a", marginTop: 6, marginBottom: 0 }}>
                Node.js running via WebAssembly · zero infrastructure · fully client-side
              </p>
            </div>
          </motion.div>
        )}

        {state === "booting" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: "12px 20px", borderTop: "1px solid #1a3a1a" }}
          >
            <p style={{ fontSize: 11, color: "#4a7a4a", margin: 0 }}>
              Starting your personal BrowserPod server — this takes about 10–15 seconds on first load…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden terminal — BrowserPod needs a DOM element but we don't show it */}
      <div ref={termRef} style={{ display: "none" }} />
    </motion.div>
  );
}
