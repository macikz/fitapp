import type {
  TrainingDay,
  TrainingSession,
  FoodEntry,
  UserSettings,
} from "./types";

const KEYS = {
  trainingDays: "fitapp_training_days",
  trainingSessions: "fitapp_training_sessions",
  foodEntries: "fitapp_food_entries",
  settings: "fitapp_settings",
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Training Days ────────────────────────────────────────────────────────────

export function getTrainingDays(): TrainingDay[] {
  return load<TrainingDay[]>(KEYS.trainingDays, []);
}

export function saveTrainingDays(days: TrainingDay[]): void {
  save(KEYS.trainingDays, days);
}

// ─── Training Sessions ────────────────────────────────────────────────────────

export function getTrainingSessions(): TrainingSession[] {
  return load<TrainingSession[]>(KEYS.trainingSessions, []);
}

export function saveTrainingSessions(sessions: TrainingSession[]): void {
  save(KEYS.trainingSessions, sessions);
}

export function addTrainingSession(session: TrainingSession): void {
  const all = getTrainingSessions();
  save(KEYS.trainingSessions, [session, ...all]);
}

// ─── Food Entries ─────────────────────────────────────────────────────────────

export function getFoodEntries(): FoodEntry[] {
  return load<FoodEntry[]>(KEYS.foodEntries, []);
}

export function getFoodEntriesForDate(date: string): FoodEntry[] {
  return getFoodEntries().filter((e) => e.date === date);
}

export function addFoodEntry(entry: FoodEntry): void {
  const all = getFoodEntries();
  save(KEYS.foodEntries, [entry, ...all]);
}

export function deleteFoodEntry(id: string): void {
  const all = getFoodEntries().filter((e) => e.id !== id);
  save(KEYS.foodEntries, all);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: UserSettings = {
  weight: 80,
  goal: "maintain",
  targetCalories: 2500,
  targetProtein: 160,
  targetCarbs: 280,
  targetFat: 80,
};

export function getSettings(): UserSettings {
  return load<UserSettings>(KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(settings: UserSettings): void {
  save(KEYS.settings, settings);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
