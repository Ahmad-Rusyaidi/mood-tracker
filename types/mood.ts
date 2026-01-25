export const MOODS = ["happy", "sad", "angry", "neutral", "anxious"] as const;

export type Mood = (typeof MOODS)[number];

export type MoodEntry = {
  /** YYYY-MM-DD in user's local time */
  date: string;
  mood: Mood;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
};
