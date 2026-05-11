import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/audit", label: "Audit" },
  { to: "/scan", label: "Scanner" },
  { to: "/learn", label: "Learn" },
  { to: "/about", label: "About" },
  { to: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 border-b"
      style={{
        borderColor: "hsl(120 33% 12%)",
        background: "rgba(6,14,6,0.92)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex flex-shrink-0 items-center gap-2" onClick={() => setOpen(false)}>
          <img
            src="/logo.svg"
            alt="Green Code"
            className="h-8 w-8 drop-shadow-[0_0_8px_rgba(0,232,135,0.3)]"
          />
          <span className="font-mono text-sm font-semibold tracking-wide text-foreground">Green Code</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1.5">
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`relative flex-shrink-0 rounded-full border px-3.5 py-1.5 transition-all ${
                  active
                    ? "border-primary/45 bg-primary/10 shadow-[0_0_18px_rgba(0,232,135,0.12)]"
                    : "border-transparent hover:border-primary/20 hover:bg-primary/5"
                }`}
              >
                <span
                  className={`whitespace-nowrap font-mono text-xs transition-colors ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-x-3 -bottom-px h-px bg-primary/80"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Hamburger button — mobile only */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-md border text-muted-foreground hover:text-foreground transition-colors"
          style={{ borderColor: "hsl(120 33% 16%)" }}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t"
            style={{ borderColor: "hsl(120 33% 12%)", background: "rgba(6,14,6,0.97)" }}
          >
            <div className="flex flex-col px-4 py-3 gap-1">
              {links.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={`rounded-md px-3 py-3 font-mono text-sm transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
