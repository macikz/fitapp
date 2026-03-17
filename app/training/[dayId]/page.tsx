"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getTrainingDays,
  getTrainingSessions,
  addTrainingSession,
  generateId,
  todayISO,
  formatDate,
} from "@/lib/storage";
import { evaluateExercise, statusIcon } from "@/lib/evaluation";
import ExerciseEvaluation from "@/components/ExerciseEvaluation";
import type { TrainingDay, ExerciseLog, TrainingSession, EvaluationResult } from "@/lib/types";

interface ExerciseInput {
  exerciseId: string;
  topSetWeight: string;
  topSetReps: string;
  backOffWeight: string;
  backOffReps: string;
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

export default function TrainingDayPage() {
  const { dayId } = useParams<{ dayId: string }>();
  const router = useRouter();

  const [day, setDay] = useState<TrainingDay | null>(null);
  const [inputs, setInputs] = useState<ExerciseInput[]>([]);
  const [saved, setSaved] = useState(false);
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [history, setHistory] = useState<TrainingSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const days = getTrainingDays();
    const found = days.find((d) => d.id === dayId);
    if (!found) { router.push("/training"); return; }
    setDay(found);
    setInputs(
      found.exercises.map((ex) => ({
        exerciseId: ex.id,
        topSetWeight: "",
        topSetReps: "",
        backOffWeight: "",
        backOffReps: "",
      }))
    );
    const sessions = getTrainingSessions().filter((s) => s.dayId === dayId);
    setHistory(sessions);
  }, [dayId, router]);

  function updateInput(exId: string, field: keyof Omit<ExerciseInput, "exerciseId">, value: string) {
    setInputs((prev) =>
      prev.map((inp) => (inp.exerciseId === exId ? { ...inp, [field]: value } : inp))
    );
  }

  function handleTopSetWeightChange(exId: string, value: string) {
    const ex = day?.exercises.find((e) => e.id === exId);
    if (ex && value) {
      const topWeight = parseFloat(value);
      if (!isNaN(topWeight)) {
        const suggested = Math.round((topWeight * (1 - ex.backOffDropPercent / 100)) / 2.5) * 2.5;
        setInputs((prev) =>
          prev.map((inp) =>
            inp.exerciseId === exId
              ? { ...inp, topSetWeight: value, backOffWeight: inp.backOffWeight || String(suggested) }
              : inp
          )
        );
        return;
      }
    }
    updateInput(exId, "topSetWeight", value);
  }

  function handleSave() {
    if (!day) return;
    const logs: ExerciseLog[] = [];
    const summaryItems: SummaryItem[] = [];

    for (const inp of inputs) {
      const ex = day.exercises.find((e) => e.id === inp.exerciseId);
      if (!ex || !inp.topSetWeight || !inp.topSetReps) continue;
      const topSetWeight = parseFloat(inp.topSetWeight);
      const topSetReps = parseInt(inp.topSetReps);
      const backOffWeight = parseFloat(inp.backOffWeight) || 0;
      const backOffReps = parseInt(inp.backOffReps) || 0;
      if (isNaN(topSetWeight) || isNaN(topSetReps)) continue;

      logs.push({ exerciseId: ex.id, exerciseName: ex.name, topSetWeight, topSetReps, backOffWeight, backOffReps, date: todayISO() });
      summaryItems.push({ name: ex.name, topSetWeight, topSetReps, backOffWeight, backOffReps, evaluation: evaluateExercise(ex, topSetReps, backOffReps), weightIncrement: ex.weightIncrement });
    }

    if (logs.length === 0) return;
    const session: TrainingSession = { id: generateId(), dayId: day.id, dayName: day.name, date: todayISO(), logs };
    addTrainingSession(session);
    setSaved(true);
    setSummary(summaryItems);
    setHistory((prev) => [session, ...prev]);
  }

  if (!day) return null;
  const anyFilled = inputs.some((i) => i.topSetWeight && i.topSetReps);

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
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <button className="btn btn-ghost" onClick={() => router.push("/training")} style={{ padding: "0.4rem 0.6rem" }}>←</button>
        <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800 }}>{day.name}</h1>
      </div>

      {day.exercises.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Tento den nemá žádné cviky. Přidej je v Tréninkovém plánu.</p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.25rem" }}>
            {day.exercises.map((ex) => {
              const inp = inputs.find((i) => i.exerciseId === ex.id)!;
              const topReps = parseInt(inp?.topSetReps ?? "0");
              const backReps = parseInt(inp?.backOffReps ?? "0");
              const hasData = !isNaN(topReps) && topReps > 0;
              const evaluation = hasData ? evaluateExercise(ex, topReps, backReps) : null;
              const lastLog = history.flatMap((s) => s.logs).find((l) => l.exerciseId === ex.id);

              return (
                <div key={ex.id} className="card">
                  <div style={{ marginBottom: "0.85rem" }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem", fontFamily: "var(--font-display)" }}>{ex.name}</p>
                    {lastLog && (
                      <p style={{ margin: "0.2rem 0 0", color: "var(--accent2)", fontSize: "0.8rem" }}>
                        Naposledy: top {lastLog.topSetWeight} kg × {lastLog.topSetReps} · back {lastLog.backOffWeight} kg × {lastLog.backOffReps}
                      </p>
                    )}
                  </div>

                  <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.5rem 0.75rem", marginBottom: "0.85rem", fontSize: "0.8rem", color: "var(--muted)" }}>
                    <strong style={{ color: "var(--text)" }}>Warm-up:</strong> 2 série (nevyhodnocuje se)
                    {"  ·  "}
                    <strong style={{ color: "var(--accent)" }}>Top set:</strong> {ex.topSetRepsMin}–{ex.topSetRepsMax} op.
                    {"  ·  "}
                    <strong style={{ color: "var(--accent2)" }}>Back-off:</strong> {ex.backOffRepsMin}–{ex.backOffRepsMax} op. (−{ex.backOffDropPercent}%)
                  </div>

                  <p className="label" style={{ color: "var(--accent)" }}>Top set</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.85rem" }}>
                    <div>
                      <p className="label">Váha (kg)</p>
                      <input className="input" type="number" step="0.5"
                        placeholder={lastLog ? String(lastLog.topSetWeight) : "80"}
                        value={inp?.topSetWeight ?? ""}
                        onChange={(e) => handleTopSetWeightChange(ex.id, e.target.value)} />
                    </div>
                    <div>
                      <p className="label">Opakování</p>
                      <input className="input" type="number"
                        placeholder={`${ex.topSetRepsMin}–${ex.topSetRepsMax}`}
                        value={inp?.topSetReps ?? ""}
                        onChange={(e) => updateInput(ex.id, "topSetReps", e.target.value)} />
                    </div>
                  </div>

                  <p className="label" style={{ color: "var(--accent2)" }}>Back-off set</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.85rem" }}>
                    <div>
                      <p className="label">Váha (kg)</p>
                      <input className="input" type="number" step="0.5"
                        placeholder={inp?.topSetWeight
                          ? String(Math.round((parseFloat(inp.topSetWeight) * (1 - ex.backOffDropPercent / 100)) / 2.5) * 2.5)
                          : lastLog ? String(lastLog.backOffWeight) : "70"}
                        value={inp?.backOffWeight ?? ""}
                        onChange={(e) => updateInput(ex.id, "backOffWeight", e.target.value)} />
                    </div>
                    <div>
                      <p className="label">Opakování</p>
                      <input className="input" type="number"
                        placeholder={`${ex.backOffRepsMin}–${ex.backOffRepsMax}`}
                        value={inp?.backOffReps ?? ""}
                        onChange={(e) => updateInput(ex.id, "backOffReps", e.target.value)} />
                    </div>
                  </div>

                  {evaluation && <ExerciseEvaluation result={evaluation} />}

                  {history.length > 0 && (
                    <div style={{ marginTop: "0.85rem" }}>
                      <p className="label">Poslední výkony</p>
                      {history.slice(0, 3).map((s) => {
                        const log = s.logs.find((l) => l.exerciseId === ex.id);
                        if (!log) return null;
                        return (
                          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--muted)", padding: "0.2rem 0", borderBottom: "1px solid var(--border)" }}>
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

          {!saved ? (
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "0.8rem" }} onClick={handleSave} disabled={!anyFilled}>
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
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.3rem", gap: "0.5rem" }}>
                          <span style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: "0.95rem" }}>
                            {statusIcon(item.evaluation.status)} {item.name}
                          </span>
                          <div style={{ textAlign: "right", fontSize: "0.78rem", color: "var(--muted)", flexShrink: 0 }}>
                            <div>top {item.topSetWeight} kg × {item.topSetReps}</div>
                            <div>back {item.backOffWeight} kg × {item.backOffReps}</div>
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.5 }}>{item.evaluation.message}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", display: "flex", gap: "1.5rem" }}>
                    {[
                      { label: "Na progres", count: summary.filter((s) => s.evaluation.recommendation === "increase").length, color: "var(--accent)" },
                      { label: "Ponechat", count: summary.filter((s) => s.evaluation.recommendation === "keep").length, color: "var(--accent2)" },
                      { label: "Snížit", count: summary.filter((s) => s.evaluation.recommendation === "decrease").length, color: "var(--danger)" },
                    ].map(({ label, count, color }) => (
                      <div key={label} style={{ textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, fontFamily: "var(--font-display)", color }}>{count}</p>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <button className="btn btn-ghost" style={{ paddingLeft: 0, color: "var(--muted)" }} onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? "▲" : "▼"} Historie tréninků ({history.length})
          </button>
          {showHistory && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" }}>
              {history.map((s) => (
                <div key={s.id} className="card-sm">
                  <p style={{ margin: "0 0 0.5rem", fontWeight: 600, fontFamily: "var(--font-display)", fontSize: "0.9rem" }}>{formatDate(s.date)}</p>
                  {s.logs.map((log) => (
                    <div key={log.exerciseId} style={{ fontSize: "0.82rem", padding: "0.2rem 0", borderBottom: "1px solid var(--border)" }}>
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
