"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import MacroBar from "@/components/MacroBar";
import {
  getSettings,
  getFoodEntriesForDate,
  getTrainingSessions,
  todayISO,
  formatDate,
  DEFAULT_SETTINGS,
} from "@/lib/storage";
import type { UserSettings, FoodEntry, TrainingSession } from "@/lib/types";

export default function Dashboard() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [todayFood, setTodayFood] = useState<FoodEntry[]>([]);
  const [recentSessions, setRecentSessions] = useState<TrainingSession[]>([]);

  useEffect(() => {
    setSettings(getSettings());
    setTodayFood(getFoodEntriesForDate(todayISO()));
    setRecentSessions(getTrainingSessions().slice(0, 3));
  }, []);

  const totalMacros = todayFood.reduce(
    (acc, e) => ({
      calories: acc.calories + e.macros.calories,
      protein: acc.protein + e.macros.protein,
      carbs: acc.carbs + e.macros.carbs,
      fat: acc.fat + e.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const goalLabel = { bulk: "Nabírání", maintain: "Udržování", cut: "Hubnutí" }[settings.goal];

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "0.2rem" }}>
          {new Date().toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>FitApp</h1>
        <div className="chip" style={{ background: "var(--surface2)", border: "1px solid var(--border)", marginTop: "0.5rem" }}>
          <span style={{ color: "var(--accent)" }}>●</span>
          <span style={{ color: "var(--muted)" }}>{goalLabel} · {settings.weight} kg</span>
        </div>
      </div>

      {/* Macros today */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <p className="section-title">Dnešní makra</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <MacroBar
            label="Kalorie"
            current={totalMacros.calories}
            target={settings.targetCalories}
            unit="kcal"
            color="var(--accent)"
          />
          <MacroBar
            label="Bílkoviny"
            current={totalMacros.protein}
            target={settings.targetProtein}
            unit="g"
            color="var(--accent2)"
          />
          {settings.targetCarbs && (
            <MacroBar
              label="Sacharidy"
              current={totalMacros.carbs}
              target={settings.targetCarbs}
              unit="g"
              color="#a78bfa"
            />
          )}
          {settings.targetFat && (
            <MacroBar
              label="Tuky"
              current={totalMacros.fat}
              target={settings.targetFat}
              unit="g"
              color="var(--warn)"
            />
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <Link href="/food" style={{ textDecoration: "none" }}>
          <div
            className="card"
            style={{
              cursor: "pointer",
              textAlign: "center",
              transition: "border-color 0.15s",
              borderColor: "transparent",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.borderColor = "transparent")
            }
          >
            <div style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>◉</div>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem" }}>
              Přidat jídlo
            </p>
          </div>
        </Link>
        <Link href="/training" style={{ textDecoration: "none" }}>
          <div
            className="card"
            style={{
              cursor: "pointer",
              textAlign: "center",
              transition: "border-color 0.15s",
              borderColor: "transparent",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.borderColor = "transparent")
            }
          >
            <div style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>◈</div>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem" }}>
              Zaznamenat trénink
            </p>
          </div>
        </Link>
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="card">
          <p className="section-title">Poslední tréninky</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {recentSessions.map((s) => (
              <div key={s.id} className="card-sm" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>{s.dayName}</p>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.8rem" }}>
                    {s.logs.length} cviků · {formatDate(s.date)}
                  </p>
                </div>
                <Link href={`/training/${s.dayId}`} style={{ textDecoration: "none" }}>
                  <span className="btn btn-ghost" style={{ fontSize: "0.8rem" }}>Detail →</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
