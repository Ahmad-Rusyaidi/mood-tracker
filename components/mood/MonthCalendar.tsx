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
import { moodToEmoji } from "@/utils/moodUi";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  month: Date;
  selectedDate: string; // YYYY-MM-DD
  entriesMap: Record<string, MoodEntry>;
  onChangeMonth: (nextMonth: Date) => void;
  onSelectDate: (date: string) => void;

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
  variant = "pastel",
  size = "normal",
}: Props) {
  const cell = CELL[size];

  const grid = useMemo(() => {
    const first = startOfMonth(month);
    const offset = dayOfWeek(first); // 0..6
    const total = daysInMonth(month);

    const cells: Array<{ date: string | null; day: number | null }> = [];

    // leading blanks
    for (let i = 0; i < offset; i++) cells.push({ date: null, day: null });

    // days
    for (let day = 1; day <= total; day++) {
      const d = new Date(month.getFullYear(), month.getMonth(), day);
      cells.push({ date: toISODateLocal(d), day });
    }

    // trailing blanks to fill last row
    while (cells.length % 7 !== 0) cells.push({ date: null, day: null });

    return cells;
  }, [month]);

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

      {/* Day of week */}
      <View style={styles.dowRow}>
        {DOW.map((d, i) => (
          <Text key={`${d}-${i}`} style={[styles.dowText, { width: cell.w }]}>
            {d}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View style={[styles.grid, { gap: size === "large" ? 10 : 6 }]}>
        {grid.map((cellData, idx) => {
          // blank cell
          if (!cellData.date || !cellData.day) {
            return (
              <View
                key={`blank-${idx}`}
                style={{ width: cell.w, height: cell.h }}
              />
            );
          }

          const isSelected = cellData.date === selectedDate;
          const entry = entriesMap[cellData.date];
          const hasEntry = !!entry;

          return (
            <Pressable
              key={cellData.date}
              onPress={() => onSelectDate(cellData.date!)}
              style={[
                styles.dayCell,
                { width: cell.w, height: cell.h },
                isSelected && styles.daySelected,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Select ${cellData.date}`}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                {cellData.day}
              </Text>

              {hasEntry ? (
                <Text style={styles.moodEmoji}>{moodToEmoji[entry!.mood]}</Text>
              ) : (
                <View style={styles.dotPlaceholder} />
              )}


            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
