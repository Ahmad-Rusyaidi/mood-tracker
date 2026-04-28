import { styles } from "@/styles/mood/index.styles";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MonthCalendar } from "@/components/mood";
import { DayCalendar } from "@/components/mood/DayCalendar";
import {
  makeDimPredicate,
  MonthFilters,
  type MonthFiltersState,
} from "@/components/mood/MonthFilters";
import { WeekCalendar } from "@/components/mood/WeekCalendar";
import { useAppSettings, useMoodEntries } from "@/hooks";
import { moodStorage } from "@/storage";
import { spacing } from "@/styles";
import { toISODateLocal } from "@/utils";

type ViewMode = "day" | "week" | "month";

function parseISODateLocal(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

function countActiveFilters(filters: MonthFiltersState) {
  return (
    filters.moods.length +
    filters.tags.length +
    (filters.onlyBadDays ? 1 : 0) +
    (filters.onlyStreakDays ? 1 : 0)
  );
}

export default function HomeScreen() {
  const params = useLocalSearchParams<{ date?: string; view?: string }>();
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(toISODateLocal(today));
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const {
    map,
    getByDate,
    setMoodForDate,
    setTagsForDate,
    setNoteForDate,
    setContextForDate,
    refresh,
  } = useMoodEntries();
  const { settings, addCustomTag } = useAppSettings();
  const selectedEntry = getByDate(selectedDate);

  const [filters, setFilters] = useState<MonthFiltersState>({
    moods: [],
    tags: [],
    onlyBadDays: false,
    onlyStreakDays: false,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const handleSelectDateFromMonth = (date: string) => {
    setSelectedDate(date);
    setViewMode("day");
  };

  // Equal-width pills that stay responsive across screen sizes.
  const { width: screenWidth } = useWindowDimensions();
  const PILL_GAP = 10;
  const PILL_COUNT = 3;

  const availableWidth =
    screenWidth - spacing.md * 2 - PILL_GAP * (PILL_COUNT - 1);

  const pillWidth = Math.max(72, Math.floor(availableWidth / PILL_COUNT));

  // Sliding indicator for the active view pill.
  const indicatorX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const index = viewMode === "day" ? 0 : viewMode === "week" ? 1 : 2;

    Animated.spring(indicatorX, {
      toValue: index * (pillWidth + PILL_GAP),
      friction: 9,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [viewMode, pillWidth, indicatorX]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.toggleWrapper}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toggleIndicator,
            { width: pillWidth, transform: [{ translateX: indicatorX }] },
          ]}
        />

        <View style={styles.toggleRow}>
          {(["day", "week", "month"] as const).map((mode) => {
            const active = viewMode === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => setViewMode(mode)}
                style={[
                  styles.togglePill,
                  { width: pillWidth },
                  active ? styles.togglePillActive : styles.togglePillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    active
                      ? styles.toggleTextActive
                      : styles.toggleTextInactive,
                  ]}
                >
                  {mode.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.calendarArea}>
        {viewMode === "month" && (
          <>
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                justifyContent: "flex-start",
                marginBottom: 10,
              }}
            >
              <Pressable
                onPress={() => setFiltersOpen((value) => !value)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: "#EEF2FF",
                  borderWidth: 1,
                  borderColor: "#AFC2FF",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text style={{ fontWeight: "900" }}>Filters</Text>

                {activeFilterCount > 0 ? (
                  <View
                    style={{
                      minWidth: 22,
                      height: 22,
                      paddingHorizontal: 6,
                      borderRadius: 999,
                      backgroundColor: "#111827",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>
                      {activeFilterCount}
                    </Text>
                  </View>
                ) : null}

                <Text style={{ fontWeight: "900", color: "#1F2937" }}>
                  {filtersOpen ? "^" : "v"}
                </Text>
              </Pressable>
            </View>

            {filtersOpen ? (
              <MonthFilters
                month={month}
                entriesMap={map}
                selectedDate={selectedDate}
                value={filters}
                onChange={setFilters}
              />
            ) : null}

            <MonthCalendar
              month={month}
              selectedDate={selectedDate}
              entriesMap={map}
              onChangeMonth={setMonth}
              onSelectDate={handleSelectDateFromMonth}
              dimDay={dimDay}
              variant="pastel"
              size="normal"
            />
          </>
        )}

        {viewMode === "week" && (
          <WeekCalendar
            anchorDate={parseISODateLocal(selectedDate)}
            selectedDate={selectedDate}
            entriesMap={map}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setViewMode("day");
            }}
          />
        )}

        {viewMode === "day" && (
          <DayCalendar
            selectedDate={selectedDate}
            entry={selectedEntry}
            onChangeMood={(mood) => void setMoodForDate(selectedDate, mood)}
            onChangeTags={(tags) => void setTagsForDate(selectedDate, tags)}
            onChangeNote={(note) => void setNoteForDate(selectedDate, note)}
            onChangeContext={(key, value) =>
              void setContextForDate(selectedDate, key, value)
            }
            entriesMap={map}
            availableTags={settings.customTags}
            onCreateCustomTag={(tag) => addCustomTag(tag)}
          />
        )}
      </View>

      {__DEV__ && (
        <Text
          onPress={async () => {
            await moodStorage.clearAll();
            await refresh();
          }}
          style={{
            color: "#EF4444",
            fontWeight: "800",
            marginTop: 10,
            marginBottom: 10,
          }}
        >
          Reset all data
        </Text>
      )}
    </SafeAreaView>
  );
}
