import { useMoodEntries } from "@/hooks/useMoodEntries";
import type { Mood, MoodContextKey } from "@/types";
import type { ContextBand } from "@/utils/moodStats";
import {
  filterEntriesByQuickFocus,
  formatComboFilterLabel,
  formatEntryDate,
  getEntryHighlight,
  getHistoryQuickFocusExplanation,
  getHistorySummaryStats,
  getHistorySortExplanation,
  getMonthKey,
  isMoodParam,
  matchesComboFilter,
  matchesContextFilter,
  matchesSearch,
  normalizeQuery,
  parseComboFilter,
  parseContextFilter,
  sortEntriesByRelevance,
  type ComboFilter,
  type ContextFilter,
  type HistoryQuickFilter,
  type MonthFilter,
  type MoodFilter,
} from "@/utils/history";
import { useLocalSearchParams } from "expo-router";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

export function useHistoryScreen() {
  const params = useLocalSearchParams<{
    tag?: string;
    mood?: Mood | "all";
    month?: string | "all";
    q?: string;
    contextKey?: MoodContextKey;
    contextBand?: ContextBand;
    combo?: string;
  }>();
  const { entries, isLoading, removeByDate } = useMoodEntries();
  const [selectedMood, setSelectedMood] = useState<MoodFilter>("all");
  const [selectedMonth, setSelectedMonth] = useState<MonthFilter>("all");
  const [selectedTag, setSelectedTag] = useState<string | "all">("all");
  const [selectedContext, setSelectedContext] = useState<ContextFilter>("all");
  const [selectedCombo, setSelectedCombo] = useState<ComboFilter>("all");
  const [selectedQuickFocus, setSelectedQuickFocus] =
    useState<HistoryQuickFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const monthOptions = useMemo(() => {
    return Array.from(new Set(entries.map((entry) => getMonthKey(entry.date))));
  }, [entries]);

  const tagOptions = useMemo(() => {
    const pool =
      selectedMonth === "all"
        ? entries
        : entries.filter((entry) => getMonthKey(entry.date) === selectedMonth);

    return Array.from(new Set(pool.flatMap((entry) => entry.tags ?? []))).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [entries, selectedMonth]);

  useEffect(() => {
    if (selectedTag === "all") return;
    if (tagOptions.includes(selectedTag)) return;
    setSelectedTag("all");
  }, [selectedTag, tagOptions]);

  useEffect(() => {
    if (typeof params.tag === "string" && params.tag.trim()) {
      setSelectedTag(params.tag.trim().toLowerCase());
    }

    if (typeof params.mood === "string" && isMoodParam(params.mood)) {
      setSelectedMood(params.mood);
    }

    if (typeof params.month === "string" && params.month.trim()) {
      setSelectedMonth(params.month);
    }

    if (typeof params.q === "string") {
      setSearchQuery(params.q);
    }

    setSelectedContext(parseContextFilter(params.contextKey, params.contextBand));
    setSelectedCombo(parseComboFilter(params.combo));
  }, [
    params.tag,
    params.mood,
    params.month,
    params.q,
    params.contextKey,
    params.contextBand,
    params.combo,
  ]);

  const matchingEntries = useMemo(() => {
    const normalizedQuery = normalizeQuery(deferredSearchQuery);

    return entries.filter((entry) => {
      if (selectedMood !== "all" && entry.mood !== selectedMood) return false;
      if (selectedMonth !== "all" && getMonthKey(entry.date) !== selectedMonth) {
        return false;
      }
      if (selectedTag !== "all" && !(entry.tags ?? []).includes(selectedTag)) {
        return false;
      }
      if (!matchesContextFilter(entry, selectedContext)) return false;
      if (!matchesComboFilter(entry, selectedCombo)) return false;
      if (!matchesSearch(entry, normalizedQuery)) return false;
      return true;
    });
  }, [
    entries,
    selectedMood,
    selectedMonth,
    selectedTag,
    selectedContext,
    selectedCombo,
    deferredSearchQuery,
  ]);

  const filteredEntries = useMemo(() => {
    const focusedEntries = filterEntriesByQuickFocus(
      matchingEntries,
      selectedQuickFocus
    );
    return sortEntriesByRelevance(focusedEntries, {
      selectedTag,
      selectedContext,
      selectedCombo,
    });
  }, [
    matchingEntries,
    selectedQuickFocus,
    selectedTag,
    selectedContext,
    selectedCombo,
  ]);

  const hasEntries = entries.length > 0;
  const hasFilters =
    selectedMood !== "all" ||
    selectedMonth !== "all" ||
    selectedTag !== "all" ||
    selectedContext !== "all" ||
    selectedCombo !== "all" ||
    selectedQuickFocus !== "all" ||
    normalizeQuery(searchQuery).length > 0;
  const entryLabel = filteredEntries.length === 1 ? "entry" : "entries";

  const clearFilters = () => {
    setSelectedMood("all");
    setSelectedMonth("all");
    setSelectedTag("all");
    setSelectedContext("all");
    setSelectedCombo("all");
    setSelectedQuickFocus("all");
    setSearchQuery("");
  };

  const handleDeleteEntry = (date: string) => {
    Alert.alert(
      "Delete this entry?",
      `This will remove the check-in for ${formatEntryDate(date)}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void removeByDate(date);
          },
        },
      ]
    );
  };

  return {
    isLoading,
    hasEntries,
    hasFilters,
    filteredEntries,
    entryLabel,
    monthOptions,
    tagOptions,
    searchQuery,
    setSearchQuery,
    selectedMood,
    setSelectedMood,
    selectedMonth,
    setSelectedMonth,
    selectedTag,
    setSelectedTag,
    selectedContext,
    setSelectedContext,
    selectedCombo,
    selectedQuickFocus,
    setSelectedQuickFocus,
    selectedComboLabel: formatComboFilterLabel(selectedCombo),
    sortExplanation: getHistorySortExplanation({
      selectedTag,
      selectedContext,
      selectedCombo,
    }),
    quickFocusExplanation: getHistoryQuickFocusExplanation(selectedQuickFocus),
    summaryStats: getHistorySummaryStats(matchingEntries, {
      selectedTag,
      selectedContext,
      selectedCombo,
    }),
    getEntryHighlight: (entry: (typeof entries)[number]) =>
      getEntryHighlight({
        entry,
        selectedTag,
        selectedContext,
        selectedCombo,
      }),
    setSelectedCombo,
    clearFilters,
    handleDeleteEntry,
  };
}
