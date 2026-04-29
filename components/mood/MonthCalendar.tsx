import MaterialIcons from "@expo/vector-icons/MaterialIcons";
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
import { Pressable, Text, View, useWindowDimensions } from "react-native";

type Props = {
  month: Date;
  selectedDate: string;
  entriesMap: Record<string, MoodEntry>;
  onChangeMonth: (nextMonth: Date) => void;
  onSelectDate: (date: string) => void;
  dimDay?: (date: string, entry?: MoodEntry) => boolean;
  variant?: "pastel";
  size?: "large" | "normal";
};

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

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
  const { width: windowWidth } = useWindowDimensions();
  const gap = size === "large" ? 8 : windowWidth < 360 ? 4 : 5;
  const calendarWidth = Math.min(windowWidth - 32, 380);
  const innerWidth = calendarWidth - 32;
  const cellWidth = Math.floor((innerWidth - gap * 6) / 7);
  const cellHeight = size === "large" ? cellWidth + 10 : cellWidth + 8;

  const grid = useMemo(() => {
    const first = startOfMonth(month);
    const offset = dayOfWeek(first);
    const total = daysInMonth(month);

    const cells: { date: string | null; day: number | null }[] = [];

    for (let i = 0; i < offset; i += 1) cells.push({ date: null, day: null });

    for (let day = 1; day <= total; day += 1) {
      const d = new Date(month.getFullYear(), month.getMonth(), day);
      cells.push({ date: toISODateLocal(d), day });
    }

    while (cells.length % 7 !== 0) cells.push({ date: null, day: null });

    return cells;
  }, [month]);

  const summary = useMemo(
    () => getMonthSummary(entriesMap, month),
    [entriesMap, month]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable
          onPress={() => onChangeMonth(addMonths(month, -1))}
          style={styles.navBtn}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <MaterialIcons name="chevron-left" size={22} color="#1F2937" />
        </Pressable>

        <Text style={styles.monthText}>{monthLabel(month)}</Text>

        <Pressable
          onPress={() => onChangeMonth(addMonths(month, 1))}
          style={styles.navBtn}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <MaterialIcons name="chevron-right" size={22} color="#1F2937" />
        </Pressable>
      </View>

      <View
        style={styles.summaryRow}
      >
        {Object.entries(summary).map(([mood, count]) =>
          count > 0 ? (
            <View key={mood} style={styles.summaryPill}>
              <Text style={styles.summaryPillText}>
                {moodToEmoji[mood as keyof typeof moodToEmoji]} {count}
              </Text>
            </View>
          ) : null
        )}
      </View>

      <View style={[styles.dowRow, { gap }]}>
        {DOW.map((d, i) => (
          <Text key={`${d}-${i}`} style={[styles.dowText, { width: cellWidth }]}>
            {d}
          </Text>
        ))}
      </View>

      <View style={[styles.grid, { gap }]}>
        {grid.map((cellData, idx) => {
          if (!cellData.date || !cellData.day) {
            return (
              <View
                key={`blank-${idx}`}
                style={{ width: cellWidth, height: cellHeight }}
              />
            );
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
                { width: cellWidth, height: cellHeight },
                hasEntry ? styles.dayWithMood : styles.dayEmpty,
                isSelected && (hasEntry ? styles.dayWithMoodSelected : styles.daySelected),
                dim ? styles.dayDim : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Select ${date}`}
            >
              <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                {day}
              </Text>
              {hasEntry ? (
                <Text style={styles.moodEmojiBig}>{moodToEmoji[entry.mood]}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
