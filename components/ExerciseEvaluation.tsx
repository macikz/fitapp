import type { EvaluationResult } from "@/lib/types";
import { recommendationIcon } from "@/lib/evaluation";

interface Props {
  result: EvaluationResult;
}

export default function ExerciseEvaluation({ result }: Props) {
  const bgMap = {
    excellent: "rgba(110,231,183,0.08)",
    good: "rgba(96,165,250,0.08)",
    below: "rgba(251,191,36,0.08)",
    poor: "rgba(248,113,113,0.08)",
  };

  const borderMap = {
    excellent: "rgba(110,231,183,0.25)",
    good: "rgba(96,165,250,0.25)",
    below: "rgba(251,191,36,0.25)",
    poor: "rgba(248,113,113,0.25)",
  };

  const textColor = {
    excellent: "var(--accent)",
    good: "var(--accent2)",
    below: "var(--warn)",
    poor: "var(--danger)",
  };

  return (
    <div
      style={{
        background: bgMap[result.status],
        border: `1px solid ${borderMap[result.status]}`,
        borderRadius: 8,
        padding: "0.75rem 1rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.6rem",
      }}
    >
      <span style={{ fontSize: "1.1rem", marginTop: 1, color: textColor[result.status] }}>
        {recommendationIcon(result.recommendation)}
      </span>
      <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.5, color: "var(--text)" }}>
        {result.message}
      </p>
    </div>
  );
}

