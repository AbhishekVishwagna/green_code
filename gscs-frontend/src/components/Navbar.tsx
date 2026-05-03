import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

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

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 border-b"
      style={{
        borderColor: "hsl(120 33% 12%)",
        background: "rgba(6,14,6,0.82)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex flex-shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-mono text-lg font-bold text-primary shadow-[0_0_18px_rgba(0,232,135,0.18)]">
            G
          </span>
          <span className="font-mono text-sm font-semibold tracking-wide text-foreground">Green Code</span>
        </Link>

        <div className="flex items-center gap-1.5 overflow-x-auto">
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
      </div>
    </nav>
  );
}
