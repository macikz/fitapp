"use client";
import { useEffect, useState, useMemo } from "react";
import MacroBar from "@/components/MacroBar";
import {
  getSettings,
  getFoodEntriesForDate,
  addFoodEntry,
  deleteFoodEntry,
  getFavoriteFoods,
  todayISO,
  generateId,
  DEFAULT_SETTINGS,
} from "@/lib/storage";
import type { FoodEntry, UserSettings, Macros, FoodCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<FoodCategory, string> = {
  shake: "🥤 Shaky & proteiny",
  hlavni: "🍽️ Hlavní jídla",
  snack: "🍫 Snacky",
  ovoce_zelenina: "🥑 Ovoce & zelenina",
  ostatni: "🍴 Ostatní",
};

const CATEGORY_ORDER: FoodCategory[] = ["shake", "hlavni", "snack", "ovoce_zelenina", "ostatni"];

// ── General recommendation pool – completely separate from quick-add foods ──
interface MealTemplate {
  name: string;
  protein: number;
  calories: number;
  carbs: number;
  fat: number;
}

// Categorized meal pool
const MEAL_POOL: MealTemplate[] = [
  // Protein-focused
  { name: "kuřecí prsa 150g + rýže 100g", protein: 40, calories: 420, carbs: 45, fat: 5 },
  { name: "skyr 200g", protein: 24, calories: 140, carbs: 10, fat: 1 },
  { name: "tvaroh 200g", protein: 24, calories: 160, carbs: 6, fat: 4 },
  { name: "řecký jogurt 200g", protein: 20, calories: 180, carbs: 8, fat: 6 },
  { name: "tuňák 150g + chléb 2 krajíce", protein: 32, calories: 370, carbs: 34, fat: 4 },
  { name: "cottage cheese 200g + pečivo", protein: 28, calories: 320, carbs: 28, fat: 6 },
  { name: "vejce 3ks + toast 2ks", protein: 22, calories: 350, carbs: 30, fat: 14 },
  { name: "krůtí prsa 150g + těstoviny 80g", protein: 38, calories: 430, carbs: 44, fat: 5 },
  { name: "hovězí 150g + brambory 150g", protein: 38, calories: 450, carbs: 30, fat: 12 },
  { name: "losos 150g + quinoa 80g", protein: 36, calories: 420, carbs: 28, fat: 14 },
  { name: "protein shake 1 odměrka + banán", protein: 28, calories: 280, carbs: 35, fat: 3 },

  // Carb-focused / balanced
  { name: "ovesné vločky 80g + mléko", protein: 12, calories: 350, carbs: 55, fat: 7 },
  { name: "banán + granola 50g", protein: 5, calories: 300, carbs: 60, fat: 6 },
  { name: "rýže 150g s lehkou omáčkou", protein: 5, calories: 280, carbs: 60, fat: 3 },
  { name: "těstoviny 100g s rajčatovou omáčkou", protein: 8, calories: 320, carbs: 62, fat: 4 },
  { name: "brambory 200g pečené", protein: 4, calories: 200, carbs: 44, fat: 1 },
  { name: "pečivo 2 krajíce + džem", protein: 5, calories: 250, carbs: 48, fat: 3 },

  // Fat-focused / calorie-dense low-protein
  { name: "toast s arašídovým máslem 2 lžíce", protein: 8, calories: 320, carbs: 30, fat: 18 },
  { name: "avokádo + pečivo 2 krajíce", protein: 6, calories: 340, carbs: 32, fat: 20 },
  { name: "hrst ořechů směs 50g", protein: 7, calories: 300, carbs: 8, fat: 26 },
  { name: "banán + arašídové máslo 1 lžíce", protein: 5, calories: 220, carbs: 32, fat: 9 },
  { name: "hořká čokoláda 40g + ořechy 20g", protein: 4, calories: 280, carbs: 20, fat: 20 },
  { name: "olivový olej 2 lžíce do jídla", protein: 0, calories: 240, carbs: 0, fat: 27 },
  { name: "granola 60g + jogurt", protein: 9, calories: 350, carbs: 48, fat: 12 },

  // Small / snack
  { name: "banán", protein: 1, calories: 100, carbs: 24, fat: 0 },
  { name: "jablko + hrst ořechů", protein: 3, calories: 180, carbs: 26, fat: 8 },
  { name: "kousek pečiva s máslem", protein: 3, calories: 160, carbs: 22, fat: 7 },
  { name: "skyr 150g", protein: 18, calories: 105, carbs: 8, fat: 1 },
];

function scoreMeal(meal: MealTemplate, remCal: number, remPro: number, remCarb: number | null, remFat: number | null): number {
  let score = 0;

  // ── Calorie fit ──────────────────────────────────────────────────────────
  // Reward meals that fill remaining calories without going too far over
  const calFit = Math.min(meal.calories, remCal) - Math.max(0, meal.calories - remCal) * 0.5;
  score += calFit * 0.01;

  // ── Protein fit ──────────────────────────────────────────────────────────
  if (remPro > 15) {
    // Need protein – reward it
    score += Math.min(meal.protein, remPro) * 0.8;
  } else if (remPro <= 5) {
    // Protein done – heavily penalize high-protein meals
    score -= meal.protein * 1.5;
  } else {
    // Small remaining protein – mild reward, mild penalty
    score += Math.min(meal.protein, remPro) * 0.3;
    score -= Math.max(0, meal.protein - remPro) * 0.8;
  }

  // ── Carb fit ─────────────────────────────────────────────────────────────
  if (remCarb !== null) {
    if (remCarb > 30) {
      score += Math.min(meal.carbs, remCarb) * 0.4;
    } else if (remCarb <= 5) {
      score -= meal.carbs * 0.5;
    }
  }

  // ── Fat fit ──────────────────────────────────────────────────────────────
  if (remFat !== null) {
    if (remFat > 15) {
      score += Math.min(meal.fat, remFat) * 0.6;
    } else if (remFat <= 5) {
      score -= meal.fat * 0.4;
    }
  }

  // ── Don't suggest meals way over calorie limit ───────────────────────────
  if (meal.calories > remCal + 300) {
    score -= (meal.calories - remCal - 300) * 0.05;
  }

  return score;
}

function generateSuggestion(totals: Macros, settings: UserSettings): string {
  const remCal = Math.max(settings.targetCalories - totals.calories, 0);
  const remPro = Math.max(settings.targetProtein - totals.protein, 0);
  const remCarb = settings.targetCarbs ? Math.max(settings.targetCarbs - totals.carbs, 0) : null;
  const remFat = settings.targetFat ? Math.max(settings.targetFat - totals.fat, 0) : null;

  // All goals met
  if (remCal < 80 && remPro < 8) {
    return "✓ Denní cíle jsou splněny, výborně!";
  }

  // Context sentence
  let contextLine = "";
  if (remPro <= 5 && remCal > 150) {
    contextLine = "Bílkoviny máš splněné – doplň hlavně kalorie.";
  } else if (remPro > 30 && remCal > 300) {
    contextLine = "Chybí bílkoviny i kalorie – doplň proteinové jídlo.";
  } else if (remPro <= 10 && remCarb !== null && remCarb > 30) {
    contextLine = "Bílkoviny skoro hotové – doplň hlavně sacharidy.";
  } else if (remPro <= 10 && remFat !== null && remFat > 15) {
    contextLine = "Bílkoviny skoro hotové – doplň hlavně tuky.";
  }

  // Score and sort
  const scored = MEAL_POOL
    .map((m) => ({ meal: m, score: scoreMeal(m, remCal, remPro, remCarb, remFat) }))
    .sort((a, b) => b.score - a.score);

  const picks = scored.slice(0, 3).map((s) => s.meal);

  const lines: string[] = [];
  lines.push(`Zbývá ~${remCal.toFixed(0)} kcal a ~${remPro.toFixed(0)} g bílkovin.`);
  if (contextLine) lines.push(contextLine);
  picks.forEach((p, i) => {
    lines.push(`${i + 1}. ${p.name} (~${p.protein}g P, ~${p.calories} kcal)`);
  });

  return lines.join("\n");
}

export default function FoodPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [favorites, setFavorites] = useState([] as ReturnType<typeof getFavoriteFoods>);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingFavoriteId, setLoadingFavoriteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState<FoodCategory>("shake");

  const today = todayISO();

  useEffect(() => {
    setSettings(getSettings());
    setEntries(getFoodEntriesForDate(today));
    setFavorites(getFavoriteFoods());
  }, [today]);

  // totals are always derived from entries – never stale
  const totals: Macros = useMemo(() => entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.macros.calories,
      protein: acc.protein + e.macros.protein,
      carbs: acc.carbs + e.macros.carbs,
      fat: acc.fat + e.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ), [entries]);

  const suggestion = useMemo(() => {
    if (entries.length === 0) return "";
    return generateSuggestion(totals, settings);
  }, [totals, settings, entries.length]);

  async function analyzeText(foodText: string, favoriteId?: string) {
    if (!foodText.trim()) return;
    if (favoriteId) setLoadingFavoriteId(favoriteId);
    else setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: foodText,
          targetCalories: settings.targetCalories,
          targetProtein: settings.targetProtein,
          targetCarbs: settings.targetCarbs,
          targetFat: settings.targetFat,
          currentCalories: totals.calories,
          currentProtein: totals.protein,
          currentCarbs: totals.carbs,
          currentFat: totals.fat,
        }),
      });
      if (!res.ok) throw new Error("Chyba při analýze");
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const entry: FoodEntry = {
        id: generateId(),
        date: today,
        text: foodText.trim(),
        macros: {
          calories: data.calories ?? 0,
          protein: data.protein ?? 0,
          carbs: data.carbs ?? 0,
          fat: data.fat ?? 0,
        },
      };
      addFoodEntry(entry);
      // Update entries from storage – triggers useMemo recalculation
      setEntries(getFoodEntriesForDate(today));
      setText("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Neznámá chyba");
    } finally {
      setLoading(false);
      setLoadingFavoriteId(null);
    }
  }

  function remove(id: string) {
    deleteFoodEntry(id);
    // Update entries from storage – triggers useMemo recalculation
    setEntries(getFoodEntriesForDate(today));
  }

  const categoriesWithFoods = CATEGORY_ORDER.filter((cat) =>
    favorites.some((f) => f.category === cat)
  );

  const suggestionLines = suggestion.split("\n").filter(Boolean);

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

      {/* Suggestion – always computed from current totals */}
      {suggestion && (
        <div className="card" style={{ marginBottom: "1rem", background: "rgba(96,165,250,0.07)", borderColor: "rgba(96,165,250,0.2)" }}>
          <p className="label" style={{ color: "var(--accent2)" }}>Co ještě doplnit</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {suggestionLines.map((line, i) => (
              <p key={i} style={{ margin: 0, fontSize: i === 0 ? "0.88rem" : "0.88rem", color: i === 0 ? "var(--muted)" : "var(--text)", lineHeight: 1.5, fontWeight: i === 0 ? 400 : 500 }}>
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Quick add favorites */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <p className="section-title">Rychlé přidání</p>
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.85rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
          {categoriesWithFoods.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0,
                padding: "0.35rem 0.75rem",
                borderRadius: 99,
                border: `1px solid ${activeCategory === cat ? "var(--accent)" : "var(--border)"}`,
                background: activeCategory === cat ? "rgba(110,231,183,0.12)" : "var(--surface2)",
                color: activeCategory === cat ? "var(--accent)" : "var(--muted)",
                fontSize: "0.78rem",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {favorites
            .filter((f) => f.category === activeCategory)
            .map((food) => (
              <button
                key={food.id}
                onClick={() => analyzeText(food.description, food.id)}
                disabled={loadingFavoriteId === food.id || loading}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.65rem 0.85rem",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: loadingFavoriteId === food.id ? "rgba(110,231,183,0.08)" : "var(--surface2)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color 0.15s",
                  width: "100%",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text)" }}>{food.name}</span>
                <span style={{ fontSize: "0.82rem", color: loadingFavoriteId === food.id ? "var(--accent)" : "var(--muted)", flexShrink: 0, marginLeft: "0.5rem" }}>
                  {loadingFavoriteId === food.id ? "Analyzuji…" : "+ přidat"}
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Manual add */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <p className="section-title">Přidat vlastní jídlo</p>
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
          onClick={() => analyzeText(text)}
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
    <span className="chip" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)", fontSize: "0.78rem" }}>
      <span style={{ color }}>{label}</span>
      <span style={{ color: "var(--text)", fontWeight: 600 }}>{value.toFixed(0)}{unit}</span>
    </span>
  );
}
