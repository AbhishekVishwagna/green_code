/**
 * src/components/PodStatusBar.tsx
 *
 * Drop-in BrowserPod status panel for the Landing page.
 * Shows live terminal output while the pod boots, then displays
 * the public Portal URL once the server is running.
 *
 * Usage — add ONE line to your Landing.tsx:
 *   import PodStatusBar from "@/components/PodStatusBar";
 *   ...
 *   <PodStatusBar />
 */

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
  const [expanded,  setExpanded]  = useState(true);

  // Subscribe to pod state for live UI
  useEffect(() => {
    return subscribePodState((s, url, err) => {
      setState(s);
      if (url) setPortalUrl(url);
      if (err) setError(err);
    });
  }, []);

  // Boot pod once, attaching the live terminal element
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

  const statusText = {
    idle:    "Initialising BrowserPod…",
    booting: "Booting pod — installing express, starting server…",
    ready:   "Pod server running",
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
      {/* ── Header bar ── */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          cursor: "pointer",
          borderBottom: expanded ? "1px solid #1a3a1a" : "none",
          background: "#0f1a0f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Traffic lights */}
          <div style={{ display: "flex", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#e05c5c" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f5c542" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00e887" }} />
          </div>
          {/* Status dot + label */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginLeft: 6 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: dotColor,
                boxShadow: state === "ready"   ? `0 0 7px ${dotColor}` :
                           state === "booting" ? `0 0 5px ${dotColor}` : "none",
                transition: "all 0.4s",
              }}
            />
            <span style={{ fontSize: 11, color: "#7bd4a0", letterSpacing: 1 }}>
              BROWSERPOD — {statusText.toUpperCase()}
            </span>
          </div>
        </div>
        <span style={{ fontSize: 10, color: "#4a7a4a" }}>{expanded ? "▲ hide" : "▼ show"}</span>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* ── Portal URL bar ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 18px",
                borderBottom: "1px solid #1a3a1a",
                background: "#060e06",
                minHeight: 44,
              }}
            >
              <span style={{ fontSize: 10, color: "#4a7a4a", flexShrink: 0 }}>
                🔗 Portal URL
              </span>
              {portalUrl ? (
                <>
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      fontSize: 11,
                      color: "#00e887",
                      textDecoration: "none",
                      wordBreak: "break-all",
                    }}
                  >
                    {portalUrl}
                  </a>
                  <button
                    onClick={handleCopy}
                    style={{
                      flexShrink: 0,
                      padding: "4px 12px",
                      background: copied ? "#00e88720" : "transparent",
                      border: `1px solid ${copied ? "#00e887" : "#1a3a1a"}`,
                      borderRadius: 6,
                      color: copied ? "#00e887" : "#4a7a4a",
                      fontFamily: "inherit",
                      fontSize: 10,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {copied ? "✓ Copied!" : "Copy"}
                  </button>
                </>
              ) : (
                <span style={{ fontSize: 11, color: "#2a4a2a", fontStyle: "italic" }}>
                  {state === "error" ? `⚠ ${error}` : "Waiting for pod to start…"}
                </span>
              )}
            </div>

            {/* ── Live terminal output ── */}
            <div
              ref={termRef}
              style={{
                padding: "12px 18px",
                minHeight: 140,
                maxHeight: 240,
                overflowY: "auto",
                fontSize: 12,
                lineHeight: 1.7,
                color: "#7bd4a0",
                /* BrowserPod's createDefaultTerminal injects a <pre> here */
              }}
            />

            {/* Footer */}
            <div
              style={{
                padding: "8px 18px",
                borderTop: "1px solid #0f2a0f",
                fontSize: 10,
                color: "#2a4a2a",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Node.js running via WebAssembly · no cloud server · no terminal needed</span>
              {portalUrl && (
                <span style={{ color: "#00e88780" }}>
                  🌱 Your shareable submission link is above
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
