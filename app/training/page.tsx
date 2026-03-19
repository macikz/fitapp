"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getWorkoutTemplates,
  getWeekSchedule,
  getTrainingSessions,
  formatDate,
} from "@/lib/storage";
import type { WorkoutTemplate, WeekSchedule, TrainingSession } from "@/lib/types";

const WEEKDAYS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const WEEKDAYS_FULL = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];

function getTodayWeekday(): number {
  // JS: 0=Sun, 1=Mon... → we want 0=Mon
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export default function TrainingPage() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [schedule, setSchedule] = useState<WeekSchedule>({0:null,1:null,2:null,3:null,4:null,5:null,6:null});
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [activeDay, setActiveDay] = useState<number>(getTodayWeekday());

  useEffect(() => {
    setTemplates(getWorkoutTemplates());
    setSchedule(getWeekSchedule());
    setSessions(getTrainingSessions());
  }, []);

  const templateForDay = (day: number): WorkoutTemplate | null => {
    const tid = schedule[day];
    if (!tid) return null;
    return templates.find((t) => t.id === tid) ?? null;
  };

  const lastSessionForDay = (day: number): TrainingSession | null => {
    const tid = schedule[day];
    if (!tid) return null;
    return sessions.find((s) => s.weekday === day && s.templateId === tid) ?? null;
  };

  const activeTemplate = templateForDay(activeDay);
  const lastSession = lastSessionForDay(activeDay);

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 800 }}>Trénink</h1>
        <Link href="/training/settings" style={{ textDecoration: "none" }}>
          <button className="btn btn-secondary" style={{ fontSize: "0.82rem" }}>⚙ Šablony</button>
        </Link>
      </div>

      {/* Weekday tabs */}
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: "0.2rem" }}>
        {WEEKDAYS.map((label, i) => {
          const tmpl = templateForDay(i);
          const isToday = i === getTodayWeekday();
          const isActive = i === activeDay;
          return (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              style={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.2rem",
                padding: "0.5rem 0.65rem",
                borderRadius: 10,
                border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                background: isActive ? "rgba(110,231,183,0.12)" : "var(--surface2)",
                cursor: "pointer",
                minWidth: 44,
              }}
            >
              <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-display)", fontWeight: 700, color: isActive ? "var(--accent)" : isToday ? "var(--text)" : "var(--muted)" }}>
                {label}
              </span>
              <span style={{ fontSize: "0.6rem", color: tmpl ? "var(--accent2)" : "var(--border)", fontWeight: 600 }}>
                {tmpl ? "●" : "○"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active day detail */}
      <div style={{ marginBottom: "0.5rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>{WEEKDAYS_FULL[activeDay]}</h2>
        {activeTemplate ? (
          <p style={{ margin: "0.2rem 0 0", color: "var(--accent2)", fontSize: "0.88rem", fontWeight: 600 }}>
            {activeTemplate.name} · {activeTemplate.exercises.length} cviků
          </p>
        ) : (
          <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.88rem" }}>
            Rest day – žádný trénink přiřazen
          </p>
        )}
      </div>

      {activeTemplate ? (
        <>
          {/* Exercise list preview */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {activeTemplate.exercises.map((ex) => (
                <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.92rem" }}>{ex.name}</span>
                  <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
                    top {ex.topSetRepsMin}–{ex.topSetRepsMax} · back {ex.backOffRepsMin}–{ex.backOffRepsMax}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Last session info */}
          {lastSession && (
            <div className="card-sm" style={{ marginBottom: "1rem" }}>
              <p className="label">Poslední trénink tohoto dne</p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>{formatDate(lastSession.date)}</p>
            </div>
          )}

          {/* Start training button */}
          <Link href={`/training/log/${activeDay}`} style={{ textDecoration: "none" }}>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "0.9rem", fontSize: "1rem" }}>
              Zahájit trénink
            </button>
          </Link>
        </>
      ) : (
        <div style={{ textAlign: "center", paddingTop: "2rem", color: "var(--muted)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🛋️</div>
          <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600 }}>Rest day</p>
          <p style={{ margin: "0.4rem 0 1.5rem", fontSize: "0.88rem" }}>Přiřaď trénink v nastavení šablon</p>
          <Link href="/training/settings" style={{ textDecoration: "none" }}>
            <button className="btn btn-secondary">Otevřít nastavení šablon</button>
          </Link>
        </div>
      )}

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <p className="section-title">Poslední tréninky</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {sessions.slice(0, 4).map((s) => (
              <div key={s.id} className="card-sm" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>{s.templateName}</p>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.78rem" }}>{WEEKDAYS_FULL[s.weekday]} · {formatDate(s.date)}</p>
                </div>
                <Link href={`/training/log/${s.weekday}`} style={{ textDecoration: "none" }}>
                  <span className="btn btn-ghost" style={{ fontSize: "0.8rem" }}>→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
