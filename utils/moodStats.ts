import type { Mood, MoodEntry } from "@/types";

export type MoodSummary = Record<Mood, number>;

export type TagStat = {
  tag: string;
  count: number;
};

export type WeekdayInsight = {
  weekday: number;
  label: string;
  count: number;
  averageScore: number;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const MOOD_SCORE: Record<Mood, number> = {
  happy: 5,
  neutral: 3,
  sad: 2,
  anxious: 1,
  angry: 0,
};

function createEmptyMoodSummary(): MoodSummary {
  return {
    happy: 0,
    sad: 0,
    angry: 0,
    neutral: 0,
    anxious: 0,
  };
}

function parseISODateLocal(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

function toISODateLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date) {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  local.setDate(local.getDate() - local.getDay());
  return local;
}

function isSameMonth(date: Date, month: Date) {
  return (
    date.getFullYear() === month.getFullYear() &&
    date.getMonth() === month.getMonth()
  );
}

function incrementMood(summary: MoodSummary, mood: Mood) {
  summary[mood] += 1;
}

export function getMonthSummary(
  entriesMap: Record<string, MoodEntry>,
  month: Date
): MoodSummary {
  const y = month.getFullYear();
  const m = month.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const summary = createEmptyMoodSummary();

  for (let day = 1; day <= lastDay; day++) {
    const iso = toISODateLocal(new Date(y, m, day));
    const entry = entriesMap[iso];
    if (!entry) continue;
    incrementMood(summary, entry.mood);
  }

  return summary;
}

export function getWeekSummary(
  entriesMap: Record<string, MoodEntry>,
  anchorDate: Date
): MoodSummary {
  const summary = createEmptyMoodSummary();
  const start = startOfWeek(anchorDate);

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const entry = entriesMap[toISODateLocal(d)];
    if (!entry) continue;
    incrementMood(summary, entry.mood);
  }

  return summary;
}

export function countLoggedDaysInMonth(
  entriesMap: Record<string, MoodEntry>,
  month: Date
): number {
  return Object.values(entriesMap).filter((entry) =>
    isSameMonth(parseISODateLocal(entry.date), month)
  ).length;
}

export function countLoggedDaysInWeek(
  entriesMap: Record<string, MoodEntry>,
  anchorDate: Date
): number {
  const start = startOfWeek(anchorDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return Object.values(entriesMap).filter((entry) => {
    const date = parseISODateLocal(entry.date);
    return date >= start && date <= end;
  }).length;
}

export function getEntriesForWeek(entries: MoodEntry[], anchorDate: Date): MoodEntry[] {
  const start = startOfWeek(anchorDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return entries.filter((entry) => {
    const date = parseISODateLocal(entry.date);
    return date >= start && date <= end;
  });
}

export function getMoodStreak(
  entriesMap: Record<string, MoodEntry>,
  today: string
): number {
  let streak = 0;
  let cursor = parseISODateLocal(today);

  while (true) {
    const key = toISODateLocal(cursor);
    if (!entriesMap[key]) break;

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getLongestMoodStreak(entries: MoodEntry[]): number {
  if (entries.length === 0) return 0;

  const ordered = [...entries].sort((a, b) => (a.date > b.date ? 1 : -1));
  let longest = 1;
  let current = 1;

  for (let i = 1; i < ordered.length; i++) {
    const prev = parseISODateLocal(ordered[i - 1].date);
    const next = parseISODateLocal(ordered[i].date);
    const diffDays = Math.round(
      (next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}

export function getSameMoodStreak(
  entriesMap: Record<string, MoodEntry>,
  today: string
): { mood: Mood | null; streak: number } {
  const first = entriesMap[today];
  if (!first) return { mood: null, streak: 0 };

  const target = first.mood;
  let streak = 0;
  let cursor = parseISODateLocal(today);

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

export function getMostCommonMood(entries: MoodEntry[]): {
  mood: Mood | null;
  count: number;
} {
  if (entries.length === 0) return { mood: null, count: 0 };

  const summary = createEmptyMoodSummary();
  for (const entry of entries) incrementMood(summary, entry.mood);

  return (Object.entries(summary) as [Mood, number][]).reduce(
    (best, [mood, count]) => {
      if (count > best.count) return { mood, count };
      return best;
    },
    { mood: null as Mood | null, count: 0 }
  );
}

export function getTopTags(entries: MoodEntry[], limit = 5): TagStat[] {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    for (const tag of entry.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.tag.localeCompare(b.tag)))
    .slice(0, limit);
}

export function getTopTagsForMoods(
  entries: MoodEntry[],
  moods: Mood[],
  limit = 5
): TagStat[] {
  return getTopTags(
    entries.filter((entry) => moods.includes(entry.mood)),
    limit
  );
}

export function getWeekdayInsights(
  entries: MoodEntry[],
  minimumSamples = 2
): WeekdayInsight[] {
  const buckets = WEEKDAY_LABELS.map((label, weekday) => ({
    weekday,
    label,
    count: 0,
    totalScore: 0,
  }));

  for (const entry of entries) {
    const weekday = parseISODateLocal(entry.date).getDay();
    buckets[weekday].count += 1;
    buckets[weekday].totalScore += MOOD_SCORE[entry.mood];
  }

  return buckets
    .filter((bucket) => bucket.count >= minimumSamples)
    .map((bucket) => ({
      weekday: bucket.weekday,
      label: bucket.label,
      count: bucket.count,
      averageScore: bucket.totalScore / bucket.count,
    }))
    .sort((a, b) => b.averageScore - a.averageScore);
}
