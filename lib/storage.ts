import type {
  TrainingDay,
  TrainingSession,
  WorkoutTemplate,
  WeekSchedule,
  FoodEntry,
  UserSettings,
  FavoriteFood,
} from "./types";

const KEYS = {
  trainingDays: "fitapp_training_days",
  trainingSessions: "fitapp_training_sessions",
  workoutTemplates: "fitapp_workout_templates",
  weekSchedule: "fitapp_week_schedule",
  foodEntries: "fitapp_food_entries",
  settings: "fitapp_settings",
  favoriteFoods: "fitapp_favorite_foods",
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

// ─── Training Days (legacy) ───────────────────────────────────────────────────

export function getTrainingDays(): TrainingDay[] {
  return load<TrainingDay[]>(KEYS.trainingDays, []);
}

export function saveTrainingDays(days: TrainingDay[]): void {
  save(KEYS.trainingDays, days);
}

// ─── Workout Templates ────────────────────────────────────────────────────────

export function getWorkoutTemplates(): WorkoutTemplate[] {
  return load<WorkoutTemplate[]>(KEYS.workoutTemplates, []);
}

export function saveWorkoutTemplates(templates: WorkoutTemplate[]): void {
  save(KEYS.workoutTemplates, templates);
}

// ─── Week Schedule ────────────────────────────────────────────────────────────

export const DEFAULT_WEEK_SCHEDULE: WeekSchedule = {
  0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null,
};

export function getWeekSchedule(): WeekSchedule {
  return load<WeekSchedule>(KEYS.weekSchedule, DEFAULT_WEEK_SCHEDULE);
}

export function saveWeekSchedule(schedule: WeekSchedule): void {
  save(KEYS.weekSchedule, schedule);
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

// ─── Favorite Foods ───────────────────────────────────────────────────────────

export const DEFAULT_FAVORITE_FOODS: FavoriteFood[] = [
  // Shaky
  { id: "f1", name: "Protein shake", category: "shake", description: "2 odměrky whey chocolate grass fed proteinu, 1 lžíce arašídového másla, 1 banán, voda nebo mléko" },
  { id: "f2", name: "Whey drip", category: "shake", description: "1 odměrka whey proteinu ve vodě" },
  { id: "f3", name: "Protein jogurt s ovocem", category: "shake", description: "protein jogurt s banánem nebo jablkem" },

  // Hlavní jídla
  { id: "f4", name: "Bumbo Nambo hovězí (Banh Mi Ba)", category: "hlavni", description: "hovězí bumbo nambo z restaurace Banh Mi Ba, rýže, zelenina, omáčka" },
  { id: "f5", name: "Těstoviny penne pomodoro s mozzarellou", category: "hlavni", description: "penne těstoviny s rajčatovou omáčkou pomodoro a mozzarellou" },
  { id: "f6", name: "Quesadilla (Burrito Loco)", category: "hlavni", description: "quesadilla s hovězím nebo kuřecím masem z Burrito Loco, sýr, tortilla" },
  { id: "f7", name: "Steak Fajitas Bowl hovězí (Burrito Loco)", category: "hlavni", description: "steak fajitas bowl s hovězím masem z Burrito Loco, rýže, fazole, zelenina, salsa" },
  { id: "f8", name: "4 míchaná vejce s cibulkou a chlebem", category: "hlavni", description: "4 míchaná vejce s cibulkou, 2 krajíce chleba" },

  // Snacky
  { id: "f9", name: "Jablko", category: "ovoce_zelenina", description: "1 středně velké jablko" },
  { id: "f10", name: "Banán", category: "ovoce_zelenina", description: "1 banán" },
  { id: "f11", name: "Mrkev", category: "ovoce_zelenina", description: "2-3 mrkve jako snack" },
  { id: "f12", name: "Avokádo", category: "ovoce_zelenina", description: "půlka nebo celé avokádo" },
];

export function getFavoriteFoods(): FavoriteFood[] {
  return load<FavoriteFood[]>(KEYS.favoriteFoods, DEFAULT_FAVORITE_FOODS);
}

export function saveFavoriteFoods(foods: FavoriteFood[]): void {
  save(KEYS.favoriteFoods, foods);
}

export function addFavoriteFood(food: FavoriteFood): void {
  const all = getFavoriteFoods();
  save(KEYS.favoriteFoods, [...all, food]);
}

export function deleteFavoriteFood(id: string): void {
  const all = getFavoriteFoods().filter((f) => f.id !== id);
  save(KEYS.favoriteFoods, all);
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
