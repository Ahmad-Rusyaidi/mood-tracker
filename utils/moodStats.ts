import type { Mood, MoodContextKey, MoodEntry } from "@/types";

export type MoodSummary = Record<Mood, number>;

export type TagStat = {
  tag: string;
  count: number;
};

export type TagAssociation = {
  tag: string;
  count: number;
  averageScore: number;
  deltaFromBaseline: number;
};

export type ContextSignal = {
  key: MoodContextKey;
  lowCount: number;
  highCount: number;
  lowAverageScore: number | null;
  highAverageScore: number | null;
  delta: number | null;
};

export type ContextBand = "low" | "high";

export type ContextCoverage = {
  key: MoodContextKey;
  totalCount: number;
  thisWeekCount: number;
  enoughOverall: boolean;
  enoughThisWeek: boolean;
};

export type WeekdayInsight = {
  weekday: number;
  label: string;
  count: number;
  averageScore: number;
};

export type WeekComparison = {
  currentCount: number;
  previousCount: number;
  currentAverageScore: number | null;
  previousAverageScore: number | null;
  delta: number | null;
};

export type MonthComparison = WeekComparison;

export type ComboHighlight = {
  features: [string, string];
  count: number;
  averageScore: number;
  deltaFromBaseline: number;
  tone: "supportive" | "challenging";
};

export type WeekWarning = {
  id: string;
  title: string;
  detail: string;
  key?: MoodContextKey;
  band?: ContextBand;
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

function shiftMonth(month: Date, delta: number) {
  return new Date(month.getFullYear(), month.getMonth() + delta, 1);
}

function incrementMood(summary: MoodSummary, mood: Mood) {
  summary[mood] += 1;
}

function average(numbers: number[]) {
  if (numbers.length === 0) return null;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}

function isHardMood(mood: Mood) {
  return mood === "sad" || mood === "anxious" || mood === "angry";
}

function getContextFeature(key: MoodContextKey, value: MoodEntry[MoodContextKey]) {
  if (value == null) return null;
  if (value <= 2) return `low_${key}`;
  if (value >= 4) return `high_${key}`;
  return null;
}

function getEntryFeatures(entry: MoodEntry) {
  const features = new Set<string>();

  const energyFeature = getContextFeature("energy", entry.energy);
  const stressFeature = getContextFeature("stress", entry.stress);
  const sleepFeature = getContextFeature("sleep", entry.sleep);

  if (energyFeature) features.add(energyFeature);
  if (stressFeature) features.add(stressFeature);
  if (sleepFeature) features.add(sleepFeature);

  for (const tag of entry.tags ?? []) {
    features.add(`tag:${tag}`);
  }

  return [...features];
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
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const entry = entriesMap[toISODateLocal(date)];
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

export function getEntriesForWeek(
  entries: MoodEntry[],
  anchorDate: Date,
  weekOffset = 0
): MoodEntry[] {
  const start = startOfWeek(anchorDate);
  start.setDate(start.getDate() + weekOffset * 7);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return entries.filter((entry) => {
    const date = parseISODateLocal(entry.date);
    return date >= start && date <= end;
  });
}

export function getEntriesForMonth(
  entries: MoodEntry[],
  month: Date,
  monthOffset = 0
): MoodEntry[] {
  const targetMonth = shiftMonth(month, monthOffset);

  return entries.filter((entry) =>
    isSameMonth(parseISODateLocal(entry.date), targetMonth)
  );
}

export function getAverageMoodScore(entries: MoodEntry[]) {
  const score = average(entries.map((entry) => MOOD_SCORE[entry.mood]));
  return score == null ? null : roundToTenth(score);
}

export function getWeekComparison(
  entries: MoodEntry[],
  anchorDate: Date
): WeekComparison {
  const currentWeekEntries = getEntriesForWeek(entries, anchorDate, 0);
  const previousWeekEntries = getEntriesForWeek(entries, anchorDate, -1);

  const currentAverageScore = getAverageMoodScore(currentWeekEntries);
  const previousAverageScore = getAverageMoodScore(previousWeekEntries);

  return {
    currentCount: currentWeekEntries.length,
    previousCount: previousWeekEntries.length,
    currentAverageScore,
    previousAverageScore,
    delta:
      currentAverageScore == null || previousAverageScore == null
        ? null
        : roundToTenth(currentAverageScore - previousAverageScore),
  };
}

export function getMonthComparison(
  entries: MoodEntry[],
  month: Date
): MonthComparison {
  const currentMonthEntries = getEntriesForMonth(entries, month, 0);
  const previousMonthEntries = getEntriesForMonth(entries, month, -1);

  const currentAverageScore = getAverageMoodScore(currentMonthEntries);
  const previousAverageScore = getAverageMoodScore(previousMonthEntries);

  return {
    currentCount: currentMonthEntries.length,
    previousCount: previousMonthEntries.length,
    currentAverageScore,
    previousAverageScore,
    delta:
      currentAverageScore == null || previousAverageScore == null
        ? null
        : roundToTenth(currentAverageScore - previousAverageScore),
  };
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

export function getTagAssociations(
  entries: MoodEntry[],
  minimumSamples = 2
): TagAssociation[] {
  const baseline = getAverageMoodScore(entries);
  if (baseline == null) return [];

  const buckets = new Map<string, { count: number; totalScore: number }>();

  for (const entry of entries) {
    const uniqueTags = new Set(entry.tags ?? []);
    for (const tag of uniqueTags) {
      const bucket = buckets.get(tag) ?? { count: 0, totalScore: 0 };
      bucket.count += 1;
      bucket.totalScore += MOOD_SCORE[entry.mood];
      buckets.set(tag, bucket);
    }
  }

  return [...buckets.entries()]
    .map(([tag, bucket]) => {
      const averageScore = bucket.totalScore / bucket.count;
      return {
        tag,
        count: bucket.count,
        averageScore: roundToTenth(averageScore),
        deltaFromBaseline: roundToTenth(averageScore - baseline),
      };
    })
    .filter((item) => item.count >= minimumSamples)
    .sort((a, b) => {
      const deltaDiff = Math.abs(b.deltaFromBaseline) - Math.abs(a.deltaFromBaseline);
      if (deltaDiff !== 0) return deltaDiff;
      if (b.count !== a.count) return b.count - a.count;
      return a.tag.localeCompare(b.tag);
    });
}

export function getTopSupportiveTags(
  entries: MoodEntry[],
  limit = 3,
  minimumDelta = 0.4
) {
  return getTagAssociations(entries)
    .filter((item) => item.deltaFromBaseline >= minimumDelta)
    .sort((a, b) => {
      if (b.deltaFromBaseline !== a.deltaFromBaseline) {
        return b.deltaFromBaseline - a.deltaFromBaseline;
      }
      if (b.count !== a.count) return b.count - a.count;
      return a.tag.localeCompare(b.tag);
    })
    .slice(0, limit);
}

export function getTopChallengingTags(
  entries: MoodEntry[],
  limit = 3,
  minimumDelta = -0.4
) {
  return getTagAssociations(entries)
    .filter((item) => item.deltaFromBaseline <= minimumDelta)
    .sort((a, b) => {
      if (a.deltaFromBaseline !== b.deltaFromBaseline) {
        return a.deltaFromBaseline - b.deltaFromBaseline;
      }
      if (b.count !== a.count) return b.count - a.count;
      return a.tag.localeCompare(b.tag);
    })
    .slice(0, limit);
}

export function getContextSignal(
  entries: MoodEntry[],
  key: MoodContextKey
): ContextSignal | null {
  const lowEntries = entries.filter((entry) => {
    const value = entry[key];
    return value != null && value <= 2;
  });

  const highEntries = entries.filter((entry) => {
    const value = entry[key];
    return value != null && value >= 4;
  });

  if (lowEntries.length < 2 && highEntries.length < 2) return null;

  const lowAverageScore = getAverageMoodScore(lowEntries);
  const highAverageScore = getAverageMoodScore(highEntries);

  return {
    key,
    lowCount: lowEntries.length,
    highCount: highEntries.length,
    lowAverageScore,
    highAverageScore,
    delta:
      lowAverageScore == null || highAverageScore == null
        ? null
        : roundToTenth(highAverageScore - lowAverageScore),
  };
}

export function getContextSignals(entries: MoodEntry[]) {
  return (["energy", "stress", "sleep"] as const)
    .map((key) => getContextSignal(entries, key))
    .filter((signal): signal is ContextSignal => signal != null)
    .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));
}

export function matchesContextBand(
  entry: MoodEntry,
  key: MoodContextKey,
  band: ContextBand
) {
  const value = entry[key];
  if (value == null) return false;
  return band === "low" ? value <= 2 : value >= 4;
}

export function getContextCoverage(
  entries: MoodEntry[],
  key: MoodContextKey,
  anchorDate: Date,
  minimumSamples = 2
): ContextCoverage {
  const thisWeekEntries = getEntriesForWeek(entries, anchorDate);
  const totalCount = entries.filter((entry) => entry[key] != null).length;
  const thisWeekCount = thisWeekEntries.filter((entry) => entry[key] != null).length;

  return {
    key,
    totalCount,
    thisWeekCount,
    enoughOverall: totalCount >= minimumSamples,
    enoughThisWeek: thisWeekCount >= minimumSamples,
  };
}

export function getComboHighlights(
  entries: MoodEntry[],
  limit = 3,
  minimumSamples = 2,
  minimumDelta = 0.6
): ComboHighlight[] {
  const baseline = getAverageMoodScore(entries);
  if (baseline == null) return [];

  const buckets = new Map<string, { count: number; totalScore: number; features: [string, string] }>();

  for (const entry of entries) {
    const features = getEntryFeatures(entry);

    for (let i = 0; i < features.length; i += 1) {
      for (let j = i + 1; j < features.length; j += 1) {
        const first = features[i];
        const second = features[j];

        if (first.startsWith("tag:") && second.startsWith("tag:")) {
          continue;
        }

        const pair = [first, second].sort() as [string, string];
        const key = pair.join("|");
        const bucket = buckets.get(key) ?? {
          count: 0,
          totalScore: 0,
          features: pair,
        };

        bucket.count += 1;
        bucket.totalScore += MOOD_SCORE[entry.mood];
        buckets.set(key, bucket);
      }
    }
  }

  return [...buckets.values()]
    .map((bucket) => {
      const averageScore = bucket.totalScore / bucket.count;
      const deltaFromBaseline = roundToTenth(averageScore - baseline);

      return {
        features: bucket.features,
        count: bucket.count,
        averageScore: roundToTenth(averageScore),
        deltaFromBaseline,
        tone: deltaFromBaseline >= 0 ? "supportive" : "challenging",
      } as ComboHighlight;
    })
    .filter(
      (item) => item.count >= minimumSamples && Math.abs(item.deltaFromBaseline) >= minimumDelta
    )
    .sort((a, b) => {
      if (Math.abs(b.deltaFromBaseline) !== Math.abs(a.deltaFromBaseline)) {
        return Math.abs(b.deltaFromBaseline) - Math.abs(a.deltaFromBaseline);
      }
      if (b.count !== a.count) return b.count - a.count;
      return a.features.join("|").localeCompare(b.features.join("|"));
    })
    .slice(0, limit);
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
      averageScore: roundToTenth(bucket.totalScore / bucket.count),
    }))
    .sort((a, b) => b.averageScore - a.averageScore);
}

export function getWeekWarnings(
  entries: MoodEntry[],
  anchorDate: Date
): WeekWarning[] {
  const currentWeekEntries = getEntriesForWeek(entries, anchorDate).sort((a, b) =>
    a.date > b.date ? 1 : -1
  );

  if (currentWeekEntries.length === 0) return [];

  const warnings: WeekWarning[] = [];
  const comparison = getWeekComparison(entries, anchorDate);

  if (
    currentWeekEntries.length >= 3 &&
    comparison.previousCount >= 3 &&
    comparison.delta != null &&
    comparison.delta <= -0.8
  ) {
    warnings.push({
      id: "weekly-drop",
      title: "This week is landing heavier than last week.",
      detail: "A gentler plan might help before the week gets any tighter.",
    });
  }

  let hardStreak = 0;
  for (let i = currentWeekEntries.length - 1; i >= 0; i -= 1) {
    if (!isHardMood(currentWeekEntries[i].mood)) break;
    hardStreak += 1;
  }

  if (hardStreak >= 3) {
    warnings.push({
      id: "hard-streak",
      title: "A few harder days have stacked up.",
      detail: `${hardStreak} tough check-ins in a row is a good moment to slow the pace a little.`,
    });
  }

  const highStressEntries = currentWeekEntries.filter((entry) =>
    matchesContextBand(entry, "stress", "high")
  );
  if (highStressEntries.length >= 2) {
    warnings.push({
      id: "stress-warning",
      title: "High-stress days are piling up this week.",
      detail: `${highStressEntries.length} days logged with high stress. It may help to protect a reset sooner.`,
      key: "stress",
      band: "high",
    });
  }

  const lowSleepEntries = currentWeekEntries.filter((entry) =>
    matchesContextBand(entry, "sleep", "low")
  );
  if (lowSleepEntries.length >= 2) {
    warnings.push({
      id: "sleep-warning",
      title: "Low-sleep days are showing up more this week.",
      detail: `${lowSleepEntries.length} days logged with lower sleep. A calmer week might matter more right now.`,
      key: "sleep",
      band: "low",
    });
  }

  return warnings.slice(0, 2);
}
