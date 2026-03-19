"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getWorkoutTemplates,
  saveWorkoutTemplates,
  getWeekSchedule,
  saveWeekSchedule,
  generateId,
} from "@/lib/storage";
import type { WorkoutTemplate, Exercise, WeekSchedule } from "@/lib/types";

const WEEKDAYS_FULL = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];
type NewEx = Partial<Exercise>;

const DEFAULT_NEW_EX: NewEx = {
  topSetRepsMin: 5, topSetRepsMax: 8,
  backOffRepsMin: 6, backOffRepsMax: 10,
  weightIncrement: 2.5, backOffDropPercent: 10, warmUpSets: 2,
};

export default function TrainingSettingsPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [schedule, setSchedule] = useState<WeekSchedule>({0:null,1:null,2:null,3:null,4:null,5:null,6:null});
  const [newTemplateName, setNewTemplateName] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [newEx, setNewEx] = useState<NewEx>(DEFAULT_NEW_EX);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTemplates(getWorkoutTemplates());
    setSchedule(getWeekSchedule());
  }, []);

  function addTemplate() {
    if (!newTemplateName.trim()) return;
    const t: WorkoutTemplate = { id: generateId(), name: newTemplateName.trim(), exercises: [] };
    const updated = [...templates, t];
    setTemplates(updated);
    saveWorkoutTemplates(updated);
    setNewTemplateName("");
  }

  function deleteTemplate(id: string) {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    saveWorkoutTemplates(updated);
    // Remove from schedule
    const newSched = { ...schedule };
    Object.keys(newSched).forEach((k) => {
      if (newSched[Number(k)] === id) newSched[Number(k)] = null;
    });
    setSchedule(newSched);
    saveWeekSchedule(newSched);
  }

  function addExercise(templateId: string) {
    if (!newEx.name?.trim() || !newEx.topSetRepsMin || !newEx.topSetRepsMax) return;
    const exercise: Exercise = {
      id: generateId(),
      name: newEx.name.trim(),
      topSetRepsMin: Number(newEx.topSetRepsMin),
      topSetRepsMax: Number(newEx.topSetRepsMax),
      backOffRepsMin: Number(newEx.backOffRepsMin ?? 6),
      backOffRepsMax: Number(newEx.backOffRepsMax ?? 10),
      weightIncrement: Number(newEx.weightIncrement ?? 2.5),
      backOffDropPercent: Number(newEx.backOffDropPercent ?? 10),
      warmUpSets: 2,
    };
    const updated = templates.map((t) =>
      t.id === templateId ? { ...t, exercises: [...t.exercises, exercise] } : t
    );
    setTemplates(updated);
    saveWorkoutTemplates(updated);
    setNewEx(DEFAULT_NEW_EX);
    setEditingTemplate(null);
  }

  function removeExercise(templateId: string, exId: string) {
    const updated = templates.map((t) =>
      t.id === templateId ? { ...t, exercises: t.exercises.filter((e) => e.id !== exId) } : t
    );
    setTemplates(updated);
    saveWorkoutTemplates(updated);
  }

  function updateSchedule(day: number, templateId: string | null) {
    const updated = { ...schedule, [day]: templateId };
    setSchedule(updated);
    saveWeekSchedule(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function upd(field: keyof NewEx, val: string) {
    setNewEx((prev) => ({ ...prev, [field]: val }));
  }

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <button className="btn btn-ghost" onClick={() => router.push("/training")} style={{ padding: "0.4rem 0.6rem" }}>←</button>
        <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800 }}>Šablony & Rozvrh</h1>
      </div>

      {/* Week schedule */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <p className="section-title">Týdenní rozvrh</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {WEEKDAYS_FULL.map((day, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontWeight: 600, fontSize: "0.9rem", minWidth: 80 }}>{day}</span>
              <select
                className="input"
                style={{ flex: 1 }}
                value={schedule[i] ?? ""}
                onChange={(e) => updateSchedule(i, e.target.value || null)}
              >
                <option value="">— Rest —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        {saved && <p style={{ margin: "0.5rem 0 0", color: "var(--accent)", fontSize: "0.82rem" }}>✓ Uloženo</p>}
      </div>

      {/* Templates */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <p className="section-title" style={{ margin: 0 }}>Tréninkové šablony</p>
      </div>

      {/* Add template */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          className="input"
          placeholder="Název šablony, např. Upper A"
          value={newTemplateName}
          onChange={(e) => setNewTemplateName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTemplate()}
        />
        <button className="btn btn-primary" onClick={addTemplate} style={{ flexShrink: 0 }}>+ Přidat</button>
      </div>

      {templates.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: "2rem 0" }}>
          <p style={{ margin: 0 }}>Zatím žádné šablony. Přidej první.</p>
        </div>
      )}

      {templates.map((tmpl) => (
        <div key={tmpl.id} className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>{tmpl.name}</h2>
            <button className="btn btn-ghost" style={{ color: "var(--danger)" }} onClick={() => deleteTemplate(tmpl.id)}>✕</button>
          </div>

          {tmpl.exercises.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0 0 0.75rem" }}>Zatím žádné cviky</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.75rem" }}>
            {tmpl.exercises.map((ex) => (
              <div key={ex.id} className="card-sm">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>{ex.name}</p>
                    <p style={{ margin: "0.15rem 0 0", color: "var(--muted)", fontSize: "0.75rem" }}>
                      Top: {ex.topSetRepsMin}–{ex.topSetRepsMax} · Back-off: {ex.backOffRepsMin}–{ex.backOffRepsMax} · skok +{ex.weightIncrement}kg · −{ex.backOffDropPercent}%
                    </p>
                  </div>
                  <button className="btn btn-ghost" style={{ color: "var(--danger)", padding: "0.2rem 0.4rem", flexShrink: 0 }} onClick={() => removeExercise(tmpl.id, ex.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {editingTemplate === tmpl.id ? (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
              <p className="label">Nový cvik</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <input className="input" placeholder="Název cviku" value={newEx.name ?? ""} onChange={(e) => upd("name", e.target.value)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                  <div><p className="label">Top set min</p><input className="input" type="number" placeholder="5" value={newEx.topSetRepsMin ?? ""} onChange={(e) => upd("topSetRepsMin", e.target.value)} /></div>
                  <div><p className="label">Top set max</p><input className="input" type="number" placeholder="8" value={newEx.topSetRepsMax ?? ""} onChange={(e) => upd("topSetRepsMax", e.target.value)} /></div>
                  <div><p className="label">Back-off min</p><input className="input" type="number" placeholder="6" value={newEx.backOffRepsMin ?? ""} onChange={(e) => upd("backOffRepsMin", e.target.value)} /></div>
                  <div><p className="label">Back-off max</p><input className="input" type="number" placeholder="10" value={newEx.backOffRepsMax ?? ""} onChange={(e) => upd("backOffRepsMax", e.target.value)} /></div>
                  <div><p className="label">Skok (kg)</p><input className="input" type="number" step="0.5" placeholder="2.5" value={newEx.weightIncrement ?? ""} onChange={(e) => upd("weightIncrement", e.target.value)} /></div>
                  <div><p className="label">Back-off pokles (%)</p><input className="input" type="number" placeholder="10" value={newEx.backOffDropPercent ?? ""} onChange={(e) => upd("backOffDropPercent", e.target.value)} /></div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-primary" onClick={() => addExercise(tmpl.id)}>Přidat cvik</button>
                  <button className="btn btn-ghost" onClick={() => { setEditingTemplate(null); setNewEx(DEFAULT_NEW_EX); }}>Zrušit</button>
                </div>
              </div>
            </div>
          ) : (
            <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setEditingTemplate(tmpl.id)}>
              + Přidat cvik
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
