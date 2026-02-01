//app/(tabs)/index.tsx
import { styles } from "@/styles/mood/index.styles";
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
import { WeekCalendar } from "@/components/mood/WeekCalendar";
import { useMoodEntries } from "@/hooks";
import { moodStorage } from "@/storage";
import { spacing } from "@/styles";
import { toISODateLocal } from "@/utils";

type ViewMode = "day" | "week" | "month";

export default function HomeScreen() {
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(toISODateLocal(today));
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const { map, getByDate, setMoodForDate, setTagsForDate, setNoteForDate, refresh } = useMoodEntries();
  const selectedEntry = getByDate(selectedDate);

  useEffect(() => {
    // keep if you want future editing behavior
  }, [selectedDate, viewMode]);

  const handleSelectDateFromMonth = (date: string) => {
    setSelectedDate(date);
    setViewMode("day");
  };

  // ✅ Equal-width pills (responsive)
  const { width: screenWidth } = useWindowDimensions();
  const PILL_GAP = 10;
  const PILL_COUNT = 3;

  const availableWidth =
    screenWidth - spacing.md * 2 - PILL_GAP * (PILL_COUNT - 1);

  const pillWidth = Math.max(72, Math.floor(availableWidth / PILL_COUNT));

  // ✅ Sliding indicator
  const indicatorX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const index = viewMode === "day" ? 0 : viewMode === "week" ? 1 : 2;

    Animated.spring(indicatorX, {
      toValue: index * (pillWidth + PILL_GAP),
      friction: 9,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [viewMode, pillWidth]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Toggle with sliding indicator */}
      <View style={styles.toggleWrapper}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toggleIndicator,
            {
              width: pillWidth,
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />

        <View style={styles.toggleRow}>
          {(["day", "week", "month"] as const).map((m) => {
            const active = viewMode === m;
            return (
              <Pressable
                key={m}
                onPress={() => setViewMode(m)}
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
                  {m.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Calendar area */}
      <View style={styles.calendarArea}>
        {viewMode === "month" && (
          <MonthCalendar
            month={month}
            selectedDate={selectedDate}
            entriesMap={map}
            onChangeMonth={setMonth}
            onSelectDate={handleSelectDateFromMonth}
            variant="pastel"
            size="normal"
          />
        )}

        {viewMode === "week" && (
          <WeekCalendar
            anchorDate={new Date(selectedDate)}
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
            entriesMap={map}
          />

        )}
      </View>

      {/* Dev reset */}
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
