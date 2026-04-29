import type { Mood, MoodContextKey, MoodEntry } from "@/types";
import type { ContextBand } from "@/utils/moodStats";
import { matchesContextBand } from "@/utils/moodStats";

export type MoodFilter = Mood | "all";
export type MonthFilter = string | "all";
export type ContextFilter = "all" | `${ContextBand}:${MoodContextKey}`;
export type ComboFilter = "all" | string;
export type EntryHighlight = {
  label: string;
  detail: string;
  tone: "supportive" | "challenging" | "neutral";
};

export type HistoryMatchFilters = {
  selectedTag: string | "all";
  selectedContext: ContextFilter;
  selectedCombo: ComboFilter;
};

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

function isKnownComboFeature(feature: string) {
  return (
    feature === "high_stress" ||
    feature === "low_stress" ||
    feature === "high_sleep" ||
    feature === "low_sleep" ||
    feature === "high_energy" ||
    feature === "low_energy" ||
    feature.startsWith("tag:")
  );
}

export function parseComboFilter(raw?: string | string[]): ComboFilter {
  const source = Array.isArray(raw) ? raw[0] : raw;
  if (!source || typeof source !== "string") return "all";

  const features = source
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  if (features.length < 2) return "all";
  if (!features.every(isKnownComboFeature)) return "all";

  return features.sort().join("|");
}

function matchesFeature(entry: MoodEntry, feature: string) {
  if (feature.startsWith("tag:")) {
    return (entry.tags ?? []).includes(feature.slice(4));
  }

  const [band, key] = feature.split("_") as [ContextBand, MoodContextKey];
  if (
    (band !== "low" && band !== "high") ||
    (key !== "sleep" && key !== "stress" && key !== "energy")
  ) {
    return false;
  }

  return matchesContextBand(entry, key, band);
}

export function matchesComboFilter(entry: MoodEntry, filter: ComboFilter) {
  if (filter === "all") return true;

  return filter.split("|").every((feature) => matchesFeature(entry, feature));
}

export function formatComboFilterLabel(filter: ComboFilter) {
  if (filter === "all") return "All";

  return filter
    .split("|")
    .map((feature) => {
      if (feature.startsWith("tag:")) return `#${feature.slice(4)}`;

      const [band, key] = feature.split("_");
      if (band === "high" && key === "stress") return "High stress";
      if (band === "low" && key === "stress") return "Low stress";
      if (band === "high" && key === "sleep") return "Good sleep";
      if (band === "low" && key === "sleep") return "Low sleep";
      if (band === "high" && key === "energy") return "High energy";
      if (band === "low" && key === "energy") return "Low energy";
      return feature;
    })
    .join(" + ");
}

function getFeatureTone(feature: string) {
  return feature === "high_stress" || feature === "low_sleep" || feature === "low_energy"
    ? "challenging"
    : "supportive";
}

function getContextFilterTone(filter: ContextFilter) {
  if (filter === "all") return "neutral" as const;

  return filter === "high:stress" || filter === "low:sleep" || filter === "low:energy"
    ? ("challenging" as const)
    : ("supportive" as const);
}

export function getEntryHighlight(args: {
  entry: MoodEntry;
  selectedTag: string | "all";
  selectedContext: ContextFilter;
  selectedCombo: ComboFilter;
}): EntryHighlight | null {
  if (args.selectedCombo !== "all" && matchesComboFilter(args.entry, args.selectedCombo)) {
    const tone = args.selectedCombo
      .split("|")
      .some((feature) => getFeatureTone(feature) === "challenging")
      ? "challenging"
      : "supportive";

    return {
      label: "Matched pattern",
      detail: formatComboFilterLabel(args.selectedCombo),
      tone,
    };
  }

  if (args.selectedContext !== "all" && matchesContextFilter(args.entry, args.selectedContext)) {
    const [band, key] = args.selectedContext.split(":") as [ContextBand, MoodContextKey];
    const detail =
      band === "high" && key === "stress"
        ? "High stress"
        : band === "low" && key === "sleep"
          ? "Low sleep"
          : band === "high" && key === "sleep"
            ? "Good sleep"
            : band === "low" && key === "energy"
              ? "Low energy"
              : "High energy";

    return {
      label: "Matched signal",
      detail,
      tone: getContextFilterTone(args.selectedContext),
    };
  }

  if (args.selectedTag !== "all" && (args.entry.tags ?? []).includes(args.selectedTag)) {
    return {
      label: "Matched tag",
      detail: `#${args.selectedTag}`,
      tone: "neutral",
    };
  }

  return null;
}

function isHardMood(mood: Mood) {
  return mood === "sad" || mood === "anxious" || mood === "angry";
}

function isSteadyMood(mood: Mood) {
  return mood === "happy" || mood === "neutral";
}

function getFeatureMatchScore(entry: MoodEntry, feature: string) {
  if (!matchesFeature(entry, feature)) return 0;

  if (feature.startsWith("tag:")) return 10;

  const [band, key] = feature.split("_") as [ContextBand, MoodContextKey];
  const value = entry[key];
  if (value == null) return 0;

  const bandStrength = band === "high" ? value : 6 - value;
  return bandStrength * 10;
}

function getContextMatchScore(entry: MoodEntry, filter: ContextFilter) {
  if (filter === "all" || !matchesContextFilter(entry, filter)) return 0;
  const [band, key] = filter.split(":") as [ContextBand, MoodContextKey];
  return getFeatureMatchScore(entry, `${band}_${key}`);
}

function getMoodAlignmentBonus(entry: MoodEntry, filters: HistoryMatchFilters) {
  const comboFeatures =
    filters.selectedCombo === "all" ? [] : filters.selectedCombo.split("|");
  const contextFeature =
    filters.selectedContext === "all"
      ? null
      : filters.selectedContext.replace(":", "_");
  const features = [...comboFeatures, ...(contextFeature ? [contextFeature] : [])];

  const hasChallengingFeature = features.some(
    (feature) =>
      feature === "high_stress" || feature === "low_sleep" || feature === "low_energy"
  );
  const hasSupportiveFeature = features.some(
    (feature) =>
      feature === "low_stress" || feature === "high_sleep" || feature === "high_energy"
  );

  if (hasChallengingFeature && isHardMood(entry.mood)) return 6;
  if (hasSupportiveFeature && isSteadyMood(entry.mood)) return 6;
  return 0;
}

export function getEntryMatchScore(
  entry: MoodEntry,
  filters: HistoryMatchFilters
) {
  let score = 0;

  if (filters.selectedCombo !== "all") {
    for (const feature of filters.selectedCombo.split("|")) {
      score += getFeatureMatchScore(entry, feature);
    }
    score += 20;
  }

  if (filters.selectedContext !== "all") {
    score += getContextMatchScore(entry, filters.selectedContext);
    score += 8;
  }

  if (filters.selectedTag !== "all" && (entry.tags ?? []).includes(filters.selectedTag)) {
    score += 12;
  }

  score += getMoodAlignmentBonus(entry, filters);

  return score;
}

export function sortEntriesByRelevance(
  entries: MoodEntry[],
  filters: HistoryMatchFilters
) {
  const hasMatchDrivenFilters =
    filters.selectedTag !== "all" ||
    filters.selectedContext !== "all" ||
    filters.selectedCombo !== "all";

  if (!hasMatchDrivenFilters) {
    return [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  return [...entries].sort((left, right) => {
    const scoreDiff =
      getEntryMatchScore(right, filters) - getEntryMatchScore(left, filters);
    if (scoreDiff !== 0) return scoreDiff;
    return left.date < right.date ? 1 : -1;
  });
}

export function getHistorySortExplanation(filters: HistoryMatchFilters) {
  if (filters.selectedCombo !== "all") {
    const tone = filters.selectedCombo
      .split("|")
      .some((feature) => getFeatureTone(feature) === "challenging")
      ? "pressure-pattern"
      : "support-pattern";

    return `Showing strongest ${tone} matches first.`;
  }

  if (filters.selectedContext !== "all") {
    const detail = formatComboFilterLabel(filters.selectedContext.replace(":", "_"));
    return `Showing strongest ${detail.toLowerCase()} matches first.`;
  }

  if (filters.selectedTag !== "all") {
    return `Showing strongest #${filters.selectedTag} matches first.`;
  }

  return null;
}

export function getContextPreview(entry: MoodEntry) {
  const parts: string[] = [];

  if (entry.energy != null) parts.push(`Energy ${entry.energy}/5`);
  if (entry.stress != null) parts.push(`Stress ${entry.stress}/5`);
  if (entry.sleep != null) parts.push(`Sleep ${entry.sleep}/5`);

  return parts.length > 0 ? parts.join(" | ") : "No extra signals yet";
}
