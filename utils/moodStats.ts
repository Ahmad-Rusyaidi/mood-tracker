import type { Mood, MoodEntry } from "@/types";

function toLocalISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
    const key = toLocalISODate(d);

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
    const key = toLocalISODate(cursor);
    if (!entriesMap[key]) break;

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}