import type { MoodEntry } from "@/types";
import { getWeekSummary } from "@/utils/moodStats";
import { moodToEmoji } from "@/utils/moodUi";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

function addDays(date: Date, delta: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

function toISODateLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function WeekCalendar({
  anchorDate,
  selectedDate,
  entriesMap,
  onSelectDate,
}: {
  anchorDate: Date; // any date in the week
  selectedDate: string;
  entriesMap: Record<string, MoodEntry>;
  onSelectDate: (date: string) => void;
}) {
  const days = useMemo(() => {
    // start week on Sunday (0). If you want Monday start, I can switch.
    const base = new Date(anchorDate);
    const start = addDays(base, -base.getDay());

    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(start, i);
      const iso = toISODateLocal(d);
      return { date: iso, label: d.toLocaleString(undefined, { weekday: "short" }), day: d.getDate() };
    });
  }, [anchorDate]);
  const summary = getWeekSummary(entriesMap, anchorDate);

  return (
    <View style={{ flexDirection: "column", justifyContent: "space-between", gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 12, justifyContent: "center", marginTop: 12 }}>
        {Object.entries(summary).map(([mood, count]) =>
          count > 0 ? (
            <Text key={mood} style={{ fontSize: 14, fontWeight: "700" }}>
              {moodToEmoji[mood as keyof typeof moodToEmoji]} {count}
            </Text>
          ) : null
        )}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        {days.map((d) => {
          const entry = entriesMap[d.date];
          const isSelected = d.date === selectedDate;

          return (
            <Pressable
              key={d.date}
              onPress={() => onSelectDate(d.date)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: isSelected ? "#C9D7FF" : "#F4F6FF",
              }}
            >
              <Text style={{ fontSize: 12, opacity: 0.7 }}>{d.label}</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", marginTop: 6 }}>{d.day}</Text>
              <Text style={{ fontSize: 18, marginTop: 4 }}>
                {entry ? moodToEmoji[entry.mood] : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
