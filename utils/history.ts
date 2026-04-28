import type { Mood, MoodContextKey, MoodEntry } from "@/types";
import type { ContextBand } from "@/utils/moodStats";
import { matchesContextBand } from "@/utils/moodStats";

export type MoodFilter = Mood | "all";
export type MonthFilter = string | "all";
export type ContextFilter = "all" | `${ContextBand}:${MoodContextKey}`;

export const CONTEXT_FILTER_OPTIONS: {
  value: ContextFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "high:stress", label: "High stress" },
  { value: "low:sleep", label: "Low sleep" },
  { value: "high:sleep", label: "Good sleep" },
  { value: "low:energy", label: "Low energy" },
  { value: "high:energy", label: "High energy" },
];

export function getMonthKey(date: string) {
  return date.slice(0, 7);
}

export function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year ?? 0, (month ?? 1) - 1, 1);

  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function formatEntryDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const localDate = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);

  return localDate.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
}

export function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

export function matchesSearch(entry: MoodEntry, query: string) {
  if (!query) return true;

  const searchableParts = [
    entry.date,
    entry.mood,
    formatEntryDate(entry.date),
    ...(entry.tags ?? []),
  ];

  return searchableParts.some((part) => part.toLowerCase().includes(query));
}

export function isMoodParam(value: string): value is Mood | "all" {
  return (
    value === "all" ||
    value === "happy" ||
    value === "neutral" ||
    value === "sad" ||
    value === "angry" ||
    value === "anxious"
  );
}

export function parseContextFilter(key?: string, band?: string): ContextFilter {
  if (
    (key === "sleep" || key === "stress" || key === "energy") &&
    (band === "low" || band === "high")
  ) {
    return `${band}:${key}`;
  }

  return "all";
}

export function matchesContextFilter(entry: MoodEntry, filter: ContextFilter) {
  if (filter === "all") return true;

  const [band, key] = filter.split(":") as [ContextBand, MoodContextKey];
  return matchesContextBand(entry, key, band);
}

export function getContextPreview(entry: MoodEntry) {
  const parts: string[] = [];

  if (entry.energy != null) parts.push(`Energy ${entry.energy}/5`);
  if (entry.stress != null) parts.push(`Stress ${entry.stress}/5`);
  if (entry.sleep != null) parts.push(`Sleep ${entry.sleep}/5`);

  return parts.length > 0 ? parts.join(" | ") : "No extra signals yet";
}
