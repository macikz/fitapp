import type { Exercise, EvaluationResult } from "./types";

export function evaluateExercise(
  exercise: Exercise,
  topSetReps: number,
  backOffReps: number,
): EvaluationResult {
  const {
    topSetRepsMin,
    topSetRepsMax,
    backOffRepsMin,
    backOffRepsMax,
    weightIncrement,
  } = exercise;

  // ── Top set assessment ──────────────────────────────────────────────────
  const topAtOrAboveMax = topSetReps >= topSetRepsMax;
  const topInRange = topSetReps >= topSetRepsMin && topSetReps <= topSetRepsMax;
  const topAtMin = topSetReps === topSetRepsMin;
  const topBelowMin = topSetReps < topSetRepsMin;
  const topWellBelow = topSetReps < topSetRepsMin - 1;

  // ── Back-off assessment ─────────────────────────────────────────────────
  const backOffInRange = backOffReps >= backOffRepsMin && backOffReps <= backOffRepsMax;
  const backOffStrong = backOffReps >= backOffRepsMax;
  const backOffWeak = backOffReps < backOffRepsMin;

  // ── Combined logic ──────────────────────────────────────────────────────

  // EXCELLENT: top set hit max AND back-off solid → increase weight
  if (topAtOrAboveMax && !backOffWeak) {
    const backOffNote = backOffStrong
      ? "Back-off set byl také výborný."
      : "Back-off set byl solidní.";
    return {
      status: "excellent",
      message: `Výborný výkon. Top set splněn na horní hranici (${topSetRepsMax} op.). ${backOffNote} Příště přidej ${weightIncrement} kg.`,
      recommendation: "increase",
    };
  }

  // Top set hit max BUT back-off was weak → borderline, keep weight
  if (topAtOrAboveMax && backOffWeak) {
    return {
      status: "good",
      message: `Top set byl silný (${topSetRepsMax}+ op.), ale back-off set byl slabý (${backOffReps} op., target ≥ ${backOffRepsMin}). Příště nech stejnou váhu a zaměř se na back-off.`,
      recommendation: "keep",
    };
  }

  // GOOD: top set safely in range (above min, below max)
  if (topInRange && !topAtMin) {
    if (backOffInRange || backOffStrong) {
      return {
        status: "good",
        message: `Dobrý výkon. Top set v targetu (${topSetReps} op. z ${topSetRepsMin}–${topSetRepsMax}). Back-off set také v pořádku. Příště nech stejnou váhu.`,
        recommendation: "keep",
      };
    }
    return {
      status: "good",
      message: `Top set v targetu (${topSetReps} op.), ale back-off byl pod minimem (${backOffReps} op., target ≥ ${backOffRepsMin}). Příště nech stejnou váhu.`,
      recommendation: "keep",
    };
  }

  // BELOW: top set exactly at minimum
  if (topAtMin) {
    return {
      status: "below",
      message: `Výkon byl na spodní hranici targetu (${topSetReps} op., minimum ${topSetRepsMin}). Váhu zatím nezvyšuj. Příště nech stejnou váhu.`,
      recommendation: "keep",
    };
  }

  // POOR: top set below minimum
  if (topWellBelow) {
    return {
      status: "poor",
      message: `Nesplněno. Top set byl výrazně pod targetem (${topSetReps} op., minimum ${topSetRepsMin}). Příště váhu nezvyšuj, zvaž snížení.`,
      recommendation: "decrease",
    };
  }

  // Just below minimum by 1
  return {
    status: "poor",
    message: `Nesplněno. Top set byl těsně pod minimem (${topSetReps} op., target ≥ ${topSetRepsMin}). Příště nech stejnou váhu.`,
    recommendation: "keep",
  };
}

export function statusColor(status: EvaluationResult["status"]): string {
  switch (status) {
    case "excellent": return "var(--accent)";
    case "good": return "var(--accent2)";
    case "below": return "var(--warn)";
    case "poor": return "var(--danger)";
  }
}

export function statusIcon(status: EvaluationResult["status"]): string {
  switch (status) {
    case "excellent": return "🟢";
    case "good": return "🔵";
    case "below": return "🟡";
    case "poor": return "🔴";
  }
}

export function recommendationIcon(rec: EvaluationResult["recommendation"]): string {
  switch (rec) {
    case "increase": return "↑";
    case "keep": return "→";
    case "decrease": return "↓";
  }
}

