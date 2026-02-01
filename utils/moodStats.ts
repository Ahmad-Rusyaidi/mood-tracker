// utils/moodStats.ts
import type { Mood, MoodEntry } from "@/types";

type MoodKey = MoodEntry["mood"];
export type MoodSummary = Record<string, number>;

function toISODateLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getMonthSummary(
  entriesMap: Record<string, MoodEntry>,
  month: Date
): MoodSummary {
  const y = month.getFullYear();
  const m = month.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();

  const summary: Record<string, number> = {};

  for (let day = 1; day <= lastDay; day++) {
    const iso = toISODateLocal(new Date(y, m, day));
    const entry = entriesMap[iso];
    if (!entry) continue;

    const mood = entry.mood as MoodKey;
    summary[mood] = (summary[mood] ?? 0) + 1;
  }

  return summary;
}

export function getWeekSummary(
  entriesMap: Record<string, MoodEntry>,
  anchorDate: Date
): Record<Mood, number> {
  const result = {
    happy: 0,
    sad: 0,
    angry: 0,
    neutral: 0,
    anxious: 0,
  };

  const start = new Date(anchorDate);
  start.setDate(start.getDate() - start.getDay()); // Sunday

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toISODateLocal(d);

    const entry = entriesMap[key];
    if (entry) result[entry.mood] += 1;
  }

  return result;
}

export function getMoodStreak(
  entriesMap: Record<string, MoodEntry>,
  today: string
): number {
  let streak = 0;
  let cursor = new Date(today);

  while (true) {
    const key = toISODateLocal(cursor);
    if (!entriesMap[key]) break;

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getSameMoodStreak(
  entriesMap: Record<string, MoodEntry>,
  today: string
): { mood: Mood | null; streak: number } {
  const first = entriesMap[today];
  if (!first) return { mood: null, streak: 0 };

  const target = first.mood;
  let streak = 0;
  let cursor = new Date(today);

  while (true) {
    const key = toISODateLocal(cursor);
    const entry = entriesMap[key];
    if (!entry) break;
    if (entry.mood !== target) break;

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { mood: target, streak };
}
