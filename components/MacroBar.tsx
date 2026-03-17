"use client";

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color?: string;
}

export default function MacroBar({
  label,
  current,
  target,
  unit = "g",
  color = "var(--accent)",
}: MacroBarProps) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const remaining = Math.max(target - current, 0);
  const over = current > target;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="label" style={{ margin: 0 }}>{label}</span>
        <span style={{ fontSize: "0.82rem", color: over ? "var(--warn)" : "var(--muted)" }}>
          {over
            ? `+${(current - target).toFixed(0)} ${unit} nad cílem`
            : `zbývá ${remaining.toFixed(0)} ${unit}`}
        </span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${pct}%`,
            background: over ? "var(--warn)" : color,
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "1rem", fontWeight: 600, fontFamily: "var(--font-display)" }}>
          {current.toFixed(0)}
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 400 }}> {unit}</span>
        </span>
        <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>/ {target} {unit}</span>
      </div>
    </div>
  );
}
