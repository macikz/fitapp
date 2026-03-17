// ─── Training ───────────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  name: string;
  // Top set target
  topSetRepsMin: number;
  topSetRepsMax: number;
  // Back-off set target
  backOffRepsMin: number;
  backOffRepsMax: number;
  // Weight settings
  weightIncrement: number; // kg for progression
  backOffDropPercent: number; // e.g. 10 means -10% from top set weight
  // Informational
  warmUpSets: number; // always 2, informational only
}

export interface TrainingDay {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface SetResult {
  reps: number;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  // Top set
  topSetWeight: number;
  topSetReps: number;
  // Back-off set
  backOffWeight: number;
  backOffReps: number;
  date: string; // ISO
}

export interface TrainingSession {
  id: string;
  dayId: string;
  dayName: string;
  date: string; // ISO
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
