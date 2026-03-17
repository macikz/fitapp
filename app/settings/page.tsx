"use client";
import { useEffect, useState } from "react";
import { getSettings, saveSettings } from "@/lib/storage";
import type { UserSettings, Goal } from "@/lib/types";

const DEFAULT: UserSettings = {
  weight: 80,
  goal: "maintain",
  targetCalories: 2500,
  targetProtein: 160,
  targetCarbs: 280,
  targetFat: 80,
};

export default function SettingsPage() {
  const [s, setS] = useState<UserSettings>(DEFAULT);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setS(getSettings());
  }, []);

  function update<K extends keyof UserSettings>(k: K, v: UserSettings[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
    setSaved(false);
  }

  function handleSave() {
    saveSettings(s);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const goals: { value: Goal; label: string; desc: string }[] = [
    { value: "bulk", label: "Nabírání", desc: "Kalorický přebytek" },
    { value: "maintain", label: "Udržování", desc: "Kalorická rovnováha" },
    { value: "cut", label: "Hubnutí", desc: "Kalorický deficit" },
  ];

  return (
    <div className="page">
      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "1.5rem" }}>
        Nastavení
      </h1>

      {/* Profile */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <p className="section-title">Profil</p>
        <div>
          <p className="label">Aktuální váha (kg)</p>
          <input
            className="input"
            type="number"
            step="0.1"
            placeholder="80"
            value={s.weight || ""}
            onChange={(e) => update("weight", parseFloat(e.target.value) || 0)}
            style={{ maxWidth: 160 }}
          />
        </div>

        <div style={{ marginTop: "1rem" }}>
          <p className="label">Cíl</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {goals.map((g) => (
              <label
                key={g.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.65rem 0.85rem",
                  borderRadius: 8,
                  border: `1px solid ${s.goal === g.value ? "var(--accent)" : "var(--border)"}`,
                  background: s.goal === g.value ? "rgba(110,231,183,0.07)" : "var(--surface2)",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="goal"
                  value={g.value}
                  checked={s.goal === g.value}
                  onChange={() => update("goal", g.value)}
                  style={{ accentColor: "var(--accent)" }}
                />
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>{g.label}</p>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.78rem" }}>{g.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Macro targets */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <p className="section-title">Denní cíle</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <p className="label">Kalorie (kcal)</p>
            <input
              className="input"
              type="number"
              placeholder="2500"
              value={s.targetCalories || ""}
              onChange={(e) => update("targetCalories", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <p className="label">Bílkoviny (g)</p>
            <input
              className="input"
              type="number"
              placeholder="160"
              value={s.targetProtein || ""}
              onChange={(e) => update("targetProtein", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <p className="label">Sacharidy (g) – volitelné</p>
            <input
              className="input"
              type="number"
              placeholder="280"
              value={s.targetCarbs ?? ""}
              onChange={(e) =>
                update("targetCarbs", e.target.value ? parseFloat(e.target.value) : undefined)
              }
            />
          </div>
          <div>
            <p className="label">Tuky (g) – volitelné</p>
            <input
              className="input"
              type="number"
              placeholder="80"
              value={s.targetFat ?? ""}
              onChange={(e) =>
                update("targetFat", e.target.value ? parseFloat(e.target.value) : undefined)
              }
            />
          </div>
        </div>

        {/* Quick estimate helper */}
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            borderRadius: 8,
            background: "var(--bg)",
            border: "1px solid var(--border)",
          }}
        >
          <p className="label" style={{ marginBottom: "0.3rem" }}>
            Orientační výpočet bílkovin
          </p>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.5 }}>
            Pro nabírání a udržování doporučujeme{" "}
            <strong style={{ color: "var(--text)" }}>1,8–2,2 g / kg váhy</strong>. Při hubnutí{" "}
            <strong style={{ color: "var(--text)" }}>2,0–2,5 g / kg</strong>.
            {s.weight > 0 && (
              <>
                {" "}Pro tebe ({s.weight} kg):{" "}
                <strong style={{ color: "var(--accent)" }}>
                  {Math.round(s.weight * 2)}–{Math.round(s.weight * 2.2)} g
                </strong>
              </>
            )}
          </p>
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center", padding: "0.85rem", fontSize: "1rem" }}
        onClick={handleSave}
      >
        {saved ? "✓ Uloženo!" : "Uložit nastavení"}
      </button>
    </div>
  );
}
