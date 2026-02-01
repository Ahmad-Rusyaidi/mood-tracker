import { styles } from "@/styles/mood/index.styles";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MonthCalendar, MoodPicker } from "@/components/mood";
import { DayCalendar } from "@/components/mood/DayCalendar";
import { WeekCalendar } from "@/components/mood/WeekCalendar";
import { useMoodEntries } from "@/hooks";
import { toISODateLocal } from "@/utils";

import { moodStorage } from "@/storage";

type ViewMode = "day" | "week" | "month";

export default function HomeScreen() {
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toISODateLocal(today));
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const { map, getByDate, setMoodForDate, refresh } = useMoodEntries();
  const selectedEntry = getByDate(selectedDate);

  // For Day/Week: if already saved, hide picker unless user taps "Change mood"
  const [isEditingMood, setIsEditingMood] = useState(false);

  // Reset editing state when date or mode changes
  useEffect(() => {
    setIsEditingMood(false);
  }, [selectedDate, viewMode]);

  const handleSelectDateFromMonth = (date: string) => {
    setSelectedDate(date);
    setViewMode("day"); // 👈 jump to Day view
  };

  const shouldShowPicker =
    viewMode === "month" || !selectedEntry || isEditingMood;

  return (
    <SafeAreaView style={styles.container}>
      {/* Toggle */}
      <View style={styles.toggleRow}>
        {(["day", "week", "month"] as const).map((m) => {
          const active = viewMode === m;
          return (
            <Pressable
              key={m}
              onPress={() => setViewMode(m)}
              style={[styles.togglePill, active ? styles.togglePillActive : styles.togglePillInactive]}
            >
              <Text style={[styles.toggleText, active ? styles.toggleTextActive : styles.toggleTextInactive]}>
                {m.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
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
          />
        )}

      </View>

      {viewMode !== "day" && (
        <View style={styles.bottom}>
          <Text style={styles.dateText}>{selectedDate}</Text>
          <Text style={styles.hint}>Tap an emoji to save today’s mood.</Text>

          <MoodPicker
            value={selectedEntry?.mood ?? null}
            onChange={(mood) => void setMoodForDate(selectedDate, mood)}
          />
        </View>
      )}

      <Text
        onPress={async () => {
          await moodStorage.clearAll();
          await refresh(); // if you have refresh from hook, see note below
        }}
        style={{ color: "#EF4444", fontWeight: "700", marginTop: 8 }}
      >
        Reset all data
      </Text>
    </SafeAreaView>
  );
}
