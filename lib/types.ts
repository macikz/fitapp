// ─── Training ───────────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  name: string;
  topSetRepsMin: number;
  topSetRepsMax: number;
  backOffRepsMin: number;
  backOffRepsMax: number;
  weightIncrement: number;
  backOffDropPercent: number;
  warmUpSets: number;
}

// A named workout template (e.g. "Upper A", "Lower B")
export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: Exercise[];
}

// Maps each weekday index (0=Mon … 6=Sun) to a template id or null (rest)
export type WeekSchedule = Record<number, string | null>; // 0–6 → templateId | null

// Legacy – kept for backwards compat with old TrainingDay storage
export interface TrainingDay {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  topSetWeight: number;
  topSetReps: number;
  backOffWeight: number;
  backOffReps: number;
  date: string;
}

export interface TrainingSession {
  id: string;
  templateId: string;
  templateName: string;
  weekday: number; // 0=Mon … 6=Sun
  date: string;
  logs: ExerciseLog[];
}

export interface EvaluationResult {
  status: "excellent" | "good" | "below" | "poor";
  message: string;
  recommendation: "increase" | "keep" | "decrease";
}

// ─── Food ────────────────────────────────────────────────────────────────────

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodEntry {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  text: string;
  macros: Macros;
  suggestions?: string;
}

// ─── Favorite Foods ───────────────────────────────────────────────────────────

export type FoodCategory = "shake" | "hlavni" | "snack" | "ovoce_zelenina" | "ostatni";

export interface FavoriteFood {
  id: string;
  name: string;
  description: string; // what's in it, for AI
  category: FoodCategory;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export type Goal = "bulk" | "maintain" | "cut";

export interface UserSettings {
  weight: number;
  goal: Goal;
  targetCalories: number;
  targetProtein: number;
  targetCarbs?: number;
  targetFat?: number;
}
