import { useMoodEntries } from "@/hooks/useMoodEntries";
import type { Mood, MoodContextKey } from "@/types";
import type { ContextBand } from "@/utils/moodStats";
import {
  formatEntryDate,
  getMonthKey,
  isMoodParam,
  matchesContextFilter,
  matchesSearch,
  normalizeQuery,
  parseContextFilter,
  type ContextFilter,
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
  }>();
  const { entries, isLoading, removeByDate } = useMoodEntries();
  const [selectedMood, setSelectedMood] = useState<MoodFilter>("all");
  const [selectedMonth, setSelectedMonth] = useState<MonthFilter>("all");
  const [selectedTag, setSelectedTag] = useState<string | "all">("all");
  const [selectedContext, setSelectedContext] = useState<ContextFilter>("all");
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
  }, [
    params.tag,
    params.mood,
    params.month,
    params.q,
    params.contextKey,
    params.contextBand,
  ]);

  const filteredEntries = useMemo(() => {
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
      if (!matchesSearch(entry, normalizedQuery)) return false;
      return true;
    });
  }, [
    entries,
    selectedMood,
    selectedMonth,
    selectedTag,
    selectedContext,
    deferredSearchQuery,
  ]);

  const hasEntries = entries.length > 0;
  const hasFilters =
    selectedMood !== "all" ||
    selectedMonth !== "all" ||
    selectedTag !== "all" ||
    selectedContext !== "all" ||
    normalizeQuery(searchQuery).length > 0;
  const entryLabel = filteredEntries.length === 1 ? "entry" : "entries";

  const clearFilters = () => {
    setSelectedMood("all");
    setSelectedMonth("all");
    setSelectedTag("all");
    setSelectedContext("all");
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
    clearFilters,
    handleDeleteEntry,
  };
}
