import { MonthCalendar, MoodPicker } from "@/components/mood";
import { useMoodEntries } from "@/hooks";
import { colors, spacing, typography } from "@/styles";
import { toISODateLocal } from "@/utils";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toISODateLocal(today));

  const { map, getByDate, setMoodForDate } = useMoodEntries();
  const selectedEntry = getByDate(selectedDate);

  return (
    <SafeAreaView style={styles.container}>

      <MonthCalendar
        month={month}
        selectedDate={selectedDate}
        entriesMap={map}
        onChangeMonth={setMonth}
        onSelectDate={setSelectedDate}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{selectedDate}</Text>
        <Text style={styles.sectionHint}>Tap an emoji to save today’s mood.</Text>

        <MoodPicker
          value={selectedEntry?.mood ?? null}
          onChange={(mood) => void setMoodForDate(selectedDate, mood)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
    gap: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.mutedText,
  },
});
