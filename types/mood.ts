// types/mood.ts
export const MOODS = ["happy", "sad", "angry", "neutral", "anxious"] as const;

export type Mood = (typeof MOODS)[number];
export type ContextScale = 1 | 2 | 3 | 4 | 5;
export type MoodContextKey = "energy" | "stress" | "sleep";

export type MoodEntry = {
  /** YYYY-MM-DD in user's local time */
  date: string;
  mood: Mood;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms

  tags?: string[]; // e.g. ["work","sleep","exercise"]
  energy?: ContextScale;
  stress?: ContextScale;
  sleep?: ContextScale;
};

export type CalendarViewMode = "day" | "week" | "month";
