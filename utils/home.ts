import type { MonthFiltersState } from "@/components/mood/MonthFilters";

export type ViewMode = "day" | "week" | "month";

export function parseISODateLocal(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

export function addDays(date: Date, delta: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
}

export function countActiveFilters(filters: MonthFiltersState) {
  return (
    filters.moods.length +
    filters.tags.length +
    (filters.onlyBadDays ? 1 : 0) +
    (filters.onlyStreakDays ? 1 : 0)
  );
}
