import {
  makeDimPredicate,
  type MonthFiltersState,
} from "@/components/mood/MonthFilters";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useMoodEntries } from "@/hooks/useMoodEntries";
import { spacing } from "@/styles";
import { toISODateLocal } from "@/utils";
import {
  addDays,
  countActiveFilters,
  parseISODateLocal,
  type ViewMode,
} from "@/utils/home";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, useWindowDimensions } from "react-native";

export function useHomeScreen() {
  const params = useLocalSearchParams<{ date?: string; view?: string }>();
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(toISODateLocal(today));
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [filters, setFilters] = useState<MonthFiltersState>({
    moods: [],
    tags: [],
    onlyBadDays: false,
    onlyStreakDays: false,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    map,
    getByDate,
    setMoodForDate,
    setTagsForDate,
    setContextForDate,
  } = useMoodEntries();
  const { settings, addCustomTag } = useAppSettings();
  const selectedEntry = getByDate(selectedDate);

  const dimDay = useMemo(
    () => makeDimPredicate({ filters, entriesMap: map, selectedDate }),
    [filters, map, selectedDate]
  );
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  useEffect(() => {
    if (viewMode !== "month") {
      setFiltersOpen(false);
    }
  }, [viewMode]);

  useEffect(() => {
    const requestedDate = typeof params.date === "string" ? params.date : null;
    const requestedView = typeof params.view === "string" ? params.view : null;
    if (!requestedDate) return;

    const parsed = parseISODateLocal(requestedDate);
    if (Number.isNaN(parsed.getTime())) return;

    setSelectedDate(requestedDate);
    setMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));

    if (requestedView === "day" || requestedView === "week" || requestedView === "month") {
      setViewMode(requestedView);
    }
  }, [params.date, params.view]);

  const { width: screenWidth } = useWindowDimensions();
  const pillGap = 10;
  const pillCount = 3;
  const availableWidth =
    screenWidth - spacing.md * 2 - pillGap * (pillCount - 1);
  const pillWidth = Math.max(72, Math.floor(availableWidth / pillCount));

  const indicatorX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const index = viewMode === "day" ? 0 : viewMode === "week" ? 1 : 2;

    Animated.spring(indicatorX, {
      toValue: index * (pillWidth + pillGap),
      friction: 9,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [viewMode, pillWidth, indicatorX]);

  const handleSelectDateFromMonth = (date: string) => {
    setSelectedDate(date);
    setViewMode("day");
  };

  return {
    today,
    month,
    setMonth,
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    filters,
    setFilters,
    filtersOpen,
    setFiltersOpen,
    map,
    settings,
    selectedEntry,
    dimDay,
    activeFilterCount,
    pillWidth,
    indicatorX,
    addCustomTag,
    setMoodForDate,
    setTagsForDate,
    setContextForDate,
    handleSelectDateFromMonth,
    jumpToToday: () => setSelectedDate(toISODateLocal(today)),
    navigateWeek: (delta: number) => {
      const nextDate = addDays(parseISODateLocal(selectedDate), delta * 7);
      setSelectedDate(toISODateLocal(nextDate));
    },
    selectDateAndOpenDay: (date: string) => {
      setSelectedDate(date);
      setViewMode("day");
    },
  };
}
