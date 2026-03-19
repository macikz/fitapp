"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getWorkoutTemplates,
  getWeekSchedule,
  getTrainingSessions,
  addTrainingSession,
  generateId,
  todayISO,
  formatDate,
} from "@/lib/storage";
import { evaluateExercise, statusIcon } from "@/lib/evaluation";
import type { WorkoutTemplate, Exercise, ExerciseLog, TrainingSession, EvaluationResult } from "@/lib/types";

const WEEKDAYS_FULL = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];

// ── Rep Picker ────────────────────────────────────────────────────────────────
function RepPicker({ min, max, value, onChange }: {
  min: number; max: number; value: number | null; onChange: (v: number) => void;
}) {
  // Options: one below min, min..max, one above max
  const options = [
    { label: `${min - 1}−`, value: min - 1 },
    ...Array.from({ length: max - min + 1 }, (_, i) => ({ label: String(min + i), value: min + i })),
    { label: `${max + 1}+`, value: max + 1 },
  ];

  return (
    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        const isInRange = opt.value >= min && opt.value <= max;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: "0.55rem 0.75rem",
              borderRadius: 8,
              border: `2px solid ${isSelected ? (isInRange ? "var(--accent)" : "var(--warn)") : "var(--border)"}`,
              background: isSelected ? (isInRange ? "rgba(110,231,183,0.15)" : "rgba(251,191,36,0.12)") : "var(--surface2)",
              color: isSelected ? (isInRange ? "var(--accent)" : "var(--warn)") : "var(--muted)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              minWidth: 44,
              transition: "all 0.1s",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Exercise Input State ───────────────────────────────────────────────────────
interface ExInput {
  exerciseId: string;
  topSetWeight: string;
  topSetReps: number | null;
  backOffWeight: string;
  backOffReps: number | null;
}

interface SummaryItem {
  name: string;
  topSetWeight: number;
  topSetReps: number;
  backOffWeight: number;
  backOffReps: number;
  evaluation: EvaluationResult;
  weightIncrement: number;
}

export default function TrainingLogPage() {
  const params = useParams<{ weekday: string }>();
  const weekday = parseInt(params.weekday ?? "0");
  const router = useRouter();

  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [inputs, setInputs] = useState<ExInput[]>([]);
  const [saved, setSaved] = useState(false);
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [history, setHistory] = useState<TrainingSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const schedule = getWeekSchedule();
    const templates = getWorkoutTemplates();
    const tid = schedule[weekday];
    if (!tid) { router.push("/training"); return; }
    const tmpl = templates.find((t) => t.id === tid);
    if (!tmpl) { router.push("/training"); return; }
    setTemplate(tmpl);
    setInputs(tmpl.exercises.map((ex) => ({
      exerciseId: ex.id,
      topSetWeight: "",
      topSetReps: null,
      backOffWeight: "",
      backOffReps: null,
    })));
    const allSessions = getTrainingSessions();
    setHistory(allSessions.filter((s) => s.templateId === tid));
  }, [weekday, router]);

  function updateInput<K extends keyof ExInput>(exId: string, field: K, value: ExInput[K]) {
    setInputs((prev) => prev.map((inp) => inp.exerciseId === exId ? { ...inp, [field]: value } : inp));
  }

  function handleTopWeightChange(exId: string, value: string) {
    const ex = template?.exercises.find((e) => e.id === exId);
    if (ex && value) {
      const w = parseFloat(value);
      if (!isNaN(w)) {
        const suggested = Math.round((w * (1 - ex.backOffDropPercent / 100)) / 2.5) * 2.5;
        setInputs((prev) => prev.map((inp) =>
          inp.exerciseId === exId
            ? { ...inp, topSetWeight: value, backOffWeight: inp.backOffWeight || String(suggested) }
            : inp
        ));
        return;
      }
    }
    updateInput(exId, "topSetWeight", value);
  }

  function handleSave() {
    if (!template) return;
    const logs: ExerciseLog[] = [];
    const summaryItems: SummaryItem[] = [];

    for (const inp of inputs) {
      const ex = template.exercises.find((e) => e.id === inp.exerciseId);
      if (!ex || !inp.topSetWeight || inp.topSetReps === null) continue;
      const topW = parseFloat(inp.topSetWeight);
      const topR = inp.topSetReps;
      const backW = parseFloat(inp.backOffWeight) || 0;
      const backR = inp.backOffReps ?? 0;
      if (isNaN(topW)) continue;

      logs.push({ exerciseId: ex.id, exerciseName: ex.name, topSetWeight: topW, topSetReps: topR, backOffWeight: backW, backOffReps: backR, date: todayISO() });
      summaryItems.push({ name: ex.name, topSetWeight: topW, topSetReps: topR, backOffWeight: backW, backOffReps: backR, evaluation: evaluateExercise(ex, topR, backR), weightIncrement: ex.weightIncrement });
    }

    if (logs.length === 0) return;
    const session: TrainingSession = {
      id: generateId(),
      templateId: template.id,
      templateName: template.name,
      weekday,
      date: todayISO(),
      logs,
    };
    addTrainingSession(session);
    setSaved(true);
    setSummary(summaryItems);
    setHistory((prev) => [session, ...prev]);
  }

  if (!template) return null;

  const anyFilled = inputs.some((i) => i.topSetWeight && i.topSetReps !== null);

  const statusBg: Record<EvaluationResult["status"], string> = {
    excellent: "rgba(110,231,183,0.08)", good: "rgba(96,165,250,0.08)",
    below: "rgba(251,191,36,0.08)", poor: "rgba(248,113,113,0.08)",
  };
  const statusBorder: Record<EvaluationResult["status"], string> = {
    excellent: "rgba(110,231,183,0.3)", good: "rgba(96,165,250,0.3)",
    below: "rgba(251,191,36,0.3)", poor: "rgba(248,113,113,0.3)",
  };

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
        <button className="btn btn-ghost" onClick={() => router.push("/training")} style={{ padding: "0.4rem 0.6rem" }}>←</button>
        <div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{WEEKDAYS_FULL[weekday]}</p>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>{template.name}</h1>
        </div>
      </div>
      <p style={{ margin: "0 0 1.5rem 3rem", color: "var(--muted)", fontSize: "0.82rem" }}>
        2 warm-up série · 1 top set · 1 back-off set
      </p>

      {/* Exercises */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.25rem" }}>
        {template.exercises.map((ex) => {
          const inp = inputs.find((i) => i.exerciseId === ex.id)!;
          const hasData = inp?.topSetReps !== null && inp?.topSetWeight;
          const evaluation = hasData ? evaluateExercise(ex, inp.topSetReps!, inp.backOffReps ?? 0) : null;
          const lastLog = history.flatMap((s) => s.logs).find((l) => l.exerciseId === ex.id);

          return (
            <div key={ex.id} className="card">
              {/* Exercise name + last perf */}
              <p style={{ margin: "0 0 0.2rem", fontWeight: 700, fontSize: "1.05rem", fontFamily: "var(--font-display)" }}>{ex.name}</p>
              {lastLog ? (
                <p style={{ margin: "0 0 0.85rem", color: "var(--accent2)", fontSize: "0.8rem" }}>
                  Naposledy: top {lastLog.topSetWeight}kg × {lastLog.topSetReps} · back {lastLog.backOffWeight}kg × {lastLog.backOffReps}
                </p>
              ) : (
                <p style={{ margin: "0 0 0.85rem", color: "var(--muted)", fontSize: "0.8rem" }}>První záznam</p>
              )}

              {/* Top set */}
              <p className="label" style={{ color: "var(--accent)" }}>Top set · target {ex.topSetRepsMin}–{ex.topSetRepsMax} op.</p>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
                <div>
                  <p className="label">Váha (kg)</p>
                  <input
                    className="input"
                    type="number"
                    step="0.5"
                    placeholder={lastLog ? String(lastLog.topSetWeight) : "80"}
                    value={inp?.topSetWeight ?? ""}
                    onChange={(e) => handleTopWeightChange(ex.id, e.target.value)}
                  />
                </div>
                <div>
                  <p className="label">Opakování</p>
                  <RepPicker
                    min={ex.topSetRepsMin}
                    max={ex.topSetRepsMax}
                    value={inp?.topSetReps ?? null}
                    onChange={(v) => updateInput(ex.id, "topSetReps", v)}
                  />
                </div>
              </div>

              {/* Back-off set */}
              <p className="label" style={{ color: "var(--accent2)" }}>Back-off set · target {ex.backOffRepsMin}–{ex.backOffRepsMax} op.</p>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
                <div>
                  <p className="label">Váha (kg)</p>
                  <input
                    className="input"
                    type="number"
                    step="0.5"
                    placeholder={
                      inp?.topSetWeight
                        ? String(Math.round((parseFloat(inp.topSetWeight) * (1 - ex.backOffDropPercent / 100)) / 2.5) * 2.5)
                        : lastLog ? String(lastLog.backOffWeight) : "70"
                    }
                    value={inp?.backOffWeight ?? ""}
                    onChange={(e) => updateInput(ex.id, "backOffWeight", e.target.value)}
                  />
                </div>
                <div>
                  <p className="label">Opakování</p>
                  <RepPicker
                    min={ex.backOffRepsMin}
                    max={ex.backOffRepsMax}
                    value={inp?.backOffReps ?? null}
                    onChange={(v) => updateInput(ex.id, "backOffReps", v)}
                  />
                </div>
              </div>

              {/* Live evaluation */}
              {evaluation && (
                <div style={{
                  background: statusBg[evaluation.status],
                  border: `1px solid ${statusBorder[evaluation.status]}`,
                  borderRadius: 8, padding: "0.65rem 0.85rem",
                }}>
                  <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.5 }}>{evaluation.message}</p>
                </div>
              )}

              {/* Mini history */}
              {history.length > 0 && (
                <div style={{ marginTop: "0.85rem" }}>
                  <p className="label">Poslední výkony</p>
                  {history.slice(0, 3).map((s) => {
                    const log = s.logs.find((l) => l.exerciseId === ex.id);
                    if (!log) return null;
                    return (
                      <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--muted)", padding: "0.2rem 0", borderBottom: "1px solid var(--border)" }}>
                        <span>{formatDate(s.date)}</span>
                        <span style={{ color: "var(--text)" }}>top {log.topSetWeight}×{log.topSetReps} · back {log.backOffWeight}×{log.backOffReps}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save / Summary */}
      {!saved ? (
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "0.85rem", fontSize: "1rem" }} onClick={handleSave} disabled={!anyFilled}>
          Uložit trénink
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div className="card" style={{ background: "rgba(110,231,183,0.08)", borderColor: "rgba(110,231,183,0.3)", textAlign: "center" }}>
            <p style={{ margin: 0, color: "var(--accent)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem" }}>✓ Trénink uložen</p>
          </div>

          {summary.length > 0 && (
            <div className="card">
              <p className="section-title">Shrnutí tréninku</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {summary.map((item, i) => (
                  <div key={i} style={{ background: statusBg[item.evaluation.status], border: `1px solid ${statusBorder[item.evaluation.status]}`, borderRadius: 8, padding: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: "0.95rem" }}>
                        {statusIcon(item.evaluation.status)} {item.name}
                      </span>
                      <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--muted)", flexShrink: 0 }}>
                        <div>top {item.topSetWeight}kg × {item.topSetReps}</div>
                        <div>back {item.backOffWeight}kg × {item.backOffReps}</div>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.5 }}>{item.evaluation.message}</p>
                  </div>
                ))}
              </div>
              {/* Stats */}
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", display: "flex", gap: "1.5rem" }}>
                {[
                  { label: "Na progres", count: summary.filter((s) => s.evaluation.recommendation === "increase").length, color: "var(--accent)" },
                  { label: "Ponechat", count: summary.filter((s) => s.evaluation.recommendation === "keep").length, color: "var(--accent2)" },
                  { label: "Snížit", count: summary.filter((s) => s.evaluation.recommendation === "decrease").length, color: "var(--danger)" },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, fontFamily: "var(--font-display)", color }}>{count}</p>
                    <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full history */}
      {history.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <button className="btn btn-ghost" style={{ paddingLeft: 0, color: "var(--muted)" }} onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? "▲" : "▼"} Historie šablony {template.name} ({history.length})
          </button>
          {showHistory && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.75rem" }}>
              {history.map((s) => (
                <div key={s.id} className="card-sm">
                  <p style={{ margin: "0 0 0.4rem", fontWeight: 600, fontFamily: "var(--font-display)", fontSize: "0.88rem" }}>{formatDate(s.date)} · {WEEKDAYS_FULL[s.weekday]}</p>
                  {s.logs.map((log) => (
                    <div key={log.exerciseId} style={{ fontSize: "0.8rem", padding: "0.15rem 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ color: "var(--muted)" }}>{log.exerciseName}</span>
                      <span style={{ float: "right" }}>top {log.topSetWeight}×{log.topSetReps} · back {log.backOffWeight}×{log.backOffReps}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
