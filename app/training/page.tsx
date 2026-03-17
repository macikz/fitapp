"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getTrainingDays, saveTrainingDays, generateId } from "@/lib/storage";
import type { TrainingDay, Exercise } from "@/lib/types";

type NewEx = Partial<Exercise>;

const DEFAULT_NEW_EX: NewEx = {
  topSetRepsMin: 5,
  topSetRepsMax: 8,
  backOffRepsMin: 6,
  backOffRepsMax: 10,
  weightIncrement: 2.5,
  backOffDropPercent: 10,
  warmUpSets: 2,
};

export default function TrainingPage() {
  const [days, setDays] = useState<TrainingDay[]>([]);
  const [showNewDay, setShowNewDay] = useState(false);
  const [newDayName, setNewDayName] = useState("");
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [newEx, setNewEx] = useState<NewEx>(DEFAULT_NEW_EX);

  useEffect(() => {
    setDays(getTrainingDays());
  }, []);

  function addDay() {
    if (!newDayName.trim()) return;
    const updated = [...days, { id: generateId(), name: newDayName.trim(), exercises: [] }];
    setDays(updated);
    saveTrainingDays(updated);
    setNewDayName("");
    setShowNewDay(false);
  }

  function deleteDay(id: string) {
    const updated = days.filter((d) => d.id !== id);
    setDays(updated);
    saveTrainingDays(updated);
  }

  function addExercise(dayId: string) {
    if (
      !newEx.name?.trim() ||
      !newEx.topSetRepsMin || !newEx.topSetRepsMax ||
      !newEx.backOffRepsMin || !newEx.backOffRepsMax
    ) return;

    const exercise: Exercise = {
      id: generateId(),
      name: newEx.name.trim(),
      topSetRepsMin: Number(newEx.topSetRepsMin),
      topSetRepsMax: Number(newEx.topSetRepsMax),
      backOffRepsMin: Number(newEx.backOffRepsMin),
      backOffRepsMax: Number(newEx.backOffRepsMax),
      weightIncrement: Number(newEx.weightIncrement ?? 2.5),
      backOffDropPercent: Number(newEx.backOffDropPercent ?? 10),
      warmUpSets: 2,
    };
    const updated = days.map((d) =>
      d.id === dayId ? { ...d, exercises: [...d.exercises, exercise] } : d
    );
    setDays(updated);
    saveTrainingDays(updated);
    setNewEx(DEFAULT_NEW_EX);
    setEditingDay(null);
  }

  function removeExercise(dayId: string, exId: string) {
    const updated = days.map((d) =>
      d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d
    );
    setDays(updated);
    saveTrainingDays(updated);
  }

  function upd(field: keyof NewEx, val: string) {
    setNewEx((prev) => ({ ...prev, [field]: val }));
  }

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 800 }}>Tréninkový plán</h1>
        <button className="btn btn-primary" onClick={() => setShowNewDay(!showNewDay)}>+ Den</button>
      </div>

      {showNewDay && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <p className="label">Název dne</p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              className="input"
              placeholder="např. Push A, Nožní den..."
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDay()}
            />
            <button className="btn btn-primary" onClick={addDay}>Přidat</button>
          </div>
        </div>
      )}

      {days.length === 0 && !showNewDay && (
        <div style={{ textAlign: "center", color: "var(--muted)", paddingTop: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>◈</div>
          <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600 }}>Žádný tréninkový den</p>
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.9rem" }}>Začni kliknutím na + Den</p>
        </div>
      )}

      {days.map((day) => (
        <div key={day.id} className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>{day.name}</h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link href={`/training/${day.id}`} style={{ textDecoration: "none" }}>
                <button className="btn btn-secondary" style={{ fontSize: "0.82rem" }}>Zaznamenat →</button>
              </Link>
              <button className="btn btn-ghost" onClick={() => deleteDay(day.id)}>✕</button>
            </div>
          </div>

          {day.exercises.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0 0 0.75rem" }}>Zatím žádné cviky</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" }}>
            {day.exercises.map((ex) => (
              <div key={ex.id} className="card-sm">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>{ex.name}</p>
                    <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.78rem" }}>
                      Top set: {ex.topSetRepsMin}–{ex.topSetRepsMax} op.
                      {" · "}Back-off: {ex.backOffRepsMin}–{ex.backOffRepsMax} op. (−{ex.backOffDropPercent}%)
                      {" · "}skok +{ex.weightIncrement} kg
                    </p>
                    <p style={{ margin: "0.1rem 0 0", color: "var(--muted)", fontSize: "0.75rem" }}>
                      2 warm-up série · 1 top set · 1 back-off set
                    </p>
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ color: "var(--danger)", padding: "0.25rem 0.5rem", flexShrink: 0 }}
                    onClick={() => removeExercise(day.id, ex.id)}
                  >✕</button>
                </div>
              </div>
            ))}
          </div>

          {editingDay === day.id ? (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
              <p className="label">Nový cvik</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <input className="input" placeholder="Název cviku" value={newEx.name ?? ""} onChange={(e) => upd("name", e.target.value)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div>
                    <p className="label">Top set – min op.</p>
                    <input className="input" type="number" placeholder="5" value={newEx.topSetRepsMin ?? ""} onChange={(e) => upd("topSetRepsMin", e.target.value)} />
                  </div>
                  <div>
                    <p className="label">Top set – max op.</p>
                    <input className="input" type="number" placeholder="8" value={newEx.topSetRepsMax ?? ""} onChange={(e) => upd("topSetRepsMax", e.target.value)} />
                  </div>
                  <div>
                    <p className="label">Back-off – min op.</p>
                    <input className="input" type="number" placeholder="6" value={newEx.backOffRepsMin ?? ""} onChange={(e) => upd("backOffRepsMin", e.target.value)} />
                  </div>
                  <div>
                    <p className="label">Back-off – max op.</p>
                    <input className="input" type="number" placeholder="10" value={newEx.backOffRepsMax ?? ""} onChange={(e) => upd("backOffRepsMax", e.target.value)} />
                  </div>
                  <div>
                    <p className="label">Skok váhy (kg)</p>
                    <input className="input" type="number" step="0.5" placeholder="2.5" value={newEx.weightIncrement ?? ""} onChange={(e) => upd("weightIncrement", e.target.value)} />
                  </div>
                  <div>
                    <p className="label">Back-off pokles (%)</p>
                    <input className="input" type="number" placeholder="10" value={newEx.backOffDropPercent ?? ""} onChange={(e) => upd("backOffDropPercent", e.target.value)} />
                  </div>
                </div>
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.6rem 0.85rem", fontSize: "0.8rem", color: "var(--muted)" }}>
                  Struktura: <strong style={{ color: "var(--text)" }}>2 warm-up série</strong> + <strong style={{ color: "var(--text)" }}>1 top set</strong> + <strong style={{ color: "var(--text)" }}>1 back-off set</strong>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-primary" onClick={() => addExercise(day.id)}>Přidat cvik</button>
                  <button className="btn btn-ghost" onClick={() => { setEditingDay(null); setNewEx(DEFAULT_NEW_EX); }}>Zrušit</button>
                </div>
              </div>
            </div>
          ) : (
            <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setEditingDay(day.id)}>
              + Přidat cvik
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
