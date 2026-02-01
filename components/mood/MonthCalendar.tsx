import { styles } from "@/styles/mood/MonthCalendar.styles";
import type { MoodEntry } from "@/types";
import {
  addMonths,
  dayOfWeek,
  daysInMonth,
  monthLabel,
  startOfMonth,
  toISODateLocal,
} from "@/utils";
import { getMonthSummary } from "@/utils/moodStats";
import { moodToEmoji } from "@/utils/moodUi";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  month: Date;
  selectedDate: string; // YYYY-MM-DD
  entriesMap: Record<string, MoodEntry>;
  onChangeMonth: (nextMonth: Date) => void;
  onSelectDate: (date: string) => void;

  // ✅ new: dim logic provided by parent
  dimDay?: (date: string, entry?: MoodEntry) => boolean;

  variant?: "pastel";
  size?: "large" | "normal";
};

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

const CELL = {
  normal: { w: 38, h: 46 },
  large: { w: 42, h: 52 },
} as const;

export function MonthCalendar({
  month,
  selectedDate,
  entriesMap,
  onChangeMonth,
  onSelectDate,
  dimDay,
  variant = "pastel",
  size = "normal",
}: Props) {
  const cell = CELL[size];
  const gap = size === "large" ? 10 : 6;

  const grid = useMemo(() => {
    const first = startOfMonth(month);
    const offset = dayOfWeek(first); // 0..6
    const total = daysInMonth(month);

    const cells: Array<{ date: string | null; day: number | null }> = [];

    for (let i = 0; i < offset; i++) cells.push({ date: null, day: null });

    for (let day = 1; day <= total; day++) {
      const d = new Date(month.getFullYear(), month.getMonth(), day);
      cells.push({ date: toISODateLocal(d), day });
    }

    while (cells.length % 7 !== 0) cells.push({ date: null, day: null });

    return cells;
  }, [month]);

  const summary = useMemo(() => getMonthSummary(entriesMap, month), [entriesMap, month]);

  return (
    <View style={styles.wrap}>
      {/* Month header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => onChangeMonth(addMonths(month, -1))}
          style={styles.navBtn}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <Text style={styles.navText}>‹</Text>
        </Pressable>

        <Text style={styles.monthText}>{monthLabel(month)}</Text>

        <Pressable
          onPress={() => onChangeMonth(addMonths(month, 1))}
          style={styles.navBtn}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>

      {/* Month mood summary */}
      <View style={{ flexDirection: "row", gap: 12, justifyContent: "center", marginBottom: 10 }}>
        {Object.entries(summary).map(([mood, count]) =>
          count > 0 ? (
            <Text key={mood} style={{ fontSize: 14, fontWeight: "700" }}>
              {moodToEmoji[mood as keyof typeof moodToEmoji]} {count}
            </Text>
          ) : null
        )}
      </View>

      {/* Day of week */}
      <View style={[styles.dowRow, { gap }]}>
        {DOW.map((d, i) => (
          <Text key={`${d}-${i}`} style={[styles.dowText, { width: cell.w }]}>
            {d}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View style={[styles.grid, { gap }]}>
        {grid.map((cellData, idx) => {
          if (!cellData.date || !cellData.day) {
            return <View key={`blank-${idx}`} style={{ width: cell.w, height: cell.h }} />;
          }

          const date = cellData.date;
          const day = cellData.day;

          const isSelected = date === selectedDate;
          const entry = entriesMap[date];
          const hasEntry = !!entry;

          const dim = dimDay?.(date, entry) ?? false;

          return (
            <Pressable
              key={date}
              onPress={() => onSelectDate(date)}
              style={[
                styles.dayBase,
                { width: cell.w, height: cell.h },
                hasEntry ? styles.dayWithMood : styles.dayEmpty,
                isSelected && (hasEntry ? styles.dayWithMoodSelected : styles.daySelected),
                dim ? styles.dayDim : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Select ${date}`}
            >
              <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>{day}</Text>
              {hasEntry ? <Text style={styles.moodEmojiBig}>{moodToEmoji[entry!.mood]}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
