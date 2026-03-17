"use client";
import { useEffect, useState } from "react";
import MacroBar from "@/components/MacroBar";
import {
  getSettings,
  getFoodEntriesForDate,
  addFoodEntry,
  deleteFoodEntry,
  todayISO,
  generateId,
  DEFAULT_SETTINGS,
} from "@/lib/storage";
import type { FoodEntry, UserSettings, Macros } from "@/lib/types";

export default function FoodPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = todayISO();

  useEffect(() => {
    setSettings(getSettings());
    setEntries(getFoodEntriesForDate(today));
  }, [today]);

  const totals: Macros = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.macros.calories,
      protein: acc.protein + e.macros.protein,
      carbs: acc.carbs + e.macros.carbs,
      fat: acc.fat + e.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  async function analyze() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          targetCalories: settings.targetCalories,
          targetProtein: settings.targetProtein,
          targetCarbs: settings.targetCarbs,
          targetFat: settings.targetFat,
        }),
      });
      if (!res.ok) throw new Error("Chyba při analýze");
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const entry: FoodEntry = {
        id: generateId(),
        date: today,
        text: text.trim(),
        macros: {
          calories: data.calories ?? 0,
          protein: data.protein ?? 0,
          carbs: data.carbs ?? 0,
          fat: data.fat ?? 0,
        },
        suggestions: data.suggestions,
      };
      addFoodEntry(entry);
      const updated = getFoodEntriesForDate(today);
      setEntries(updated);
      setText("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Neznámá chyba");
    } finally {
      setLoading(false);
    }
  }

  function remove(id: string) {
    deleteFoodEntry(id);
    setEntries(getFoodEntriesForDate(today));
  }

  const lastSuggestion = [...entries].reverse().find((e) => e.suggestions)?.suggestions;

  return (
    <div className="page">
      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "1.5rem" }}>Jídlo & Makra</h1>

      {/* Macro summary */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <p className="section-title">Dnešní souhrn</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <MacroBar label="Kalorie" current={totals.calories} target={settings.targetCalories} unit="kcal" color="var(--accent)" />
          <MacroBar label="Bílkoviny" current={totals.protein} target={settings.targetProtein} unit="g" color="var(--accent2)" />
          {settings.targetCarbs && (
            <MacroBar label="Sacharidy" current={totals.carbs} target={settings.targetCarbs} unit="g" color="#a78bfa" />
          )}
          {settings.targetFat && (
            <MacroBar label="Tuky" current={totals.fat} target={settings.targetFat} unit="g" color="var(--warn)" />
          )}
        </div>
      </div>

      {/* Suggestion */}
      {lastSuggestion && (
        <div
          className="card"
          style={{ marginBottom: "1rem", background: "rgba(96,165,250,0.07)", borderColor: "rgba(96,165,250,0.2)" }}
        >
          <p className="label" style={{ color: "var(--accent2)" }}>Doporučení</p>
          <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.55 }}>{lastSuggestion}</p>
        </div>
      )}

      {/* Add food */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <p className="section-title">Přidat jídlo</p>
        <textarea
          className="input"
          placeholder="např. 4 vejce, 2 rohlíky, 150g kuře s rýží, protein shake, tvaroh"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ minHeight: 80 }}
        />
        {error && <p style={{ color: "var(--danger)", fontSize: "0.85rem", margin: "0.4rem 0 0" }}>{error}</p>}
        <button
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", marginTop: "0.75rem", padding: "0.7rem" }}
          onClick={analyze}
          disabled={loading || !text.trim()}
        >
          {loading ? "Analyzuji…" : "Odhadnout makra"}
        </button>
      </div>

      {/* Entries */}
      {entries.length > 0 && (
        <div className="card">
          <p className="section-title">Záznamy dnes</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {entries.map((e) => (
              <div key={e.id} className="card-sm">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.4, flex: 1 }}>{e.text}</p>
                  <button className="btn btn-ghost" style={{ color: "var(--danger)", padding: "0.15rem 0.4rem", flexShrink: 0 }} onClick={() => remove(e.id)}>✕</button>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  <MacroChip label="kcal" value={e.macros.calories} color="var(--accent)" />
                  <MacroChip label="P" value={e.macros.protein} unit="g" color="var(--accent2)" />
                  <MacroChip label="S" value={e.macros.carbs} unit="g" color="#a78bfa" />
                  <MacroChip label="T" value={e.macros.fat} unit="g" color="var(--warn)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MacroChip({ label, value, unit = "", color }: { label: string; value: number; unit?: string; color: string }) {
  return (
    <span
      className="chip"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        color: "var(--muted)",
        fontSize: "0.78rem",
      }}
    >
      <span style={{ color }}>{label}</span>
      <span style={{ color: "var(--text)", fontWeight: 600 }}>{value.toFixed(0)}{unit}</span>
    </span>
  );
}
