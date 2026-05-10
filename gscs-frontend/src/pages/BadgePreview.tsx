import { useSearchParams } from "react-router-dom";

export default function BadgePreview() {
  const [p] = useSearchParams();
  const score = p.get("score") ?? "0";
  const grade = p.get("grade") ?? "D";
  const credits = p.get("credits") ?? "0";
  const co2 = p.get("co2") ?? "0";
  const cert = p.get("cert") ?? "None";

  const gradeColors: Record<string, string> = {
    A: "#00e887", B: "#7bd4a0", C: "#f5c542", D: "#e05c5c",
  };
  const certColors: Record<string, string> = {
    Platinum: "#e2e8f0", Gold: "#f5c542",
    Silver: "#b0b8c1", Bronze: "#cd7f32", None: "#e05c5c",
  };
  const color = gradeColors[grade] ?? "#00e887";
  const certColor = certColors[cert] ?? "#7bd4a0";

  return (
    <div style={{
      minHeight: "100vh", background: "#060e06",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'JetBrains Mono', monospace", padding: 24,
    }}>
      <div style={{
        maxWidth: 420, width: "100%", background: "#0a1a0a",
        border: `1px solid ${color}40`, borderRadius: 16, padding: 36,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 32 }}>🌱</span>
          <div>
            <div style={{ color: "#00e887", fontWeight: 700, fontSize: 18 }}>
              Green Software Certified
            </div>
            <div style={{ color: "#4a7a4a", fontSize: 11, letterSpacing: 1 }}>
              GREEN CODE
            </div>
          </div>
        </div>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: `${certColor}18`, border: `1px solid ${certColor}50`,
          borderRadius: 20, padding: "6px 16px", marginBottom: 20,
          fontSize: 12, fontWeight: 700, color: certColor, letterSpacing: 1,
        }}>
          ✦ {cert.toUpperCase()} CERTIFICATION
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 12, marginBottom: 20,
        }}>
          {[
            { label: "SCORE",    value: score },
            { label: "GRADE",    value: grade },
            { label: "CREDITS",  value: `+${credits}` },
            { label: "CO₂ SAVED", value: `${co2}g` },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "#060e06", border: "1px solid #1a3a1a",
              borderRadius: 10, padding: 16, textAlign: "center",
            }}>
              <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 9, color: "#4a7a4a", letterSpacing: 2, marginTop: 4 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          fontSize: 10, color: "#2a5a2a", textAlign: "center",
          paddingTop: 16, borderTop: "1px solid #1a3a1a",
        }}>
          {new Date().toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric"
          })} - greencode.dev
        </div>
      </div>
    </div>
  );
}
