import { useMoodEntries } from "@/hooks";
import { colors, radius, spacing, typography } from "@/styles";
import type { Mood, MoodEntry } from "@/types";
import { moodToEmoji } from "@/utils/moodUi";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MoodFilter = Mood | "all";
type MonthFilter = string | "all";

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year ?? 0, (month ?? 1) - 1, 1);

  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function formatEntryDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const localDate = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);

  return localDate.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {children}
      </ScrollView>
    </View>
  );
}

function EntryCard({
  entry,
  onPress,
}: {
  entry: MoodEntry;
  onPress: () => void;
}) {
  const previewNote = entry.note?.trim() ? truncate(entry.note.trim(), 120) : "No note yet";
  const tags = entry.tags?.length ? entry.tags.map((tag) => `#${tag}`).join(" ") : "No tags";

  return (
    <Pressable onPress={onPress} style={styles.entryCard}>
      <View style={styles.entryTopRow}>
        <View style={styles.entryDateWrap}>
          <Text style={styles.entryDate}>{formatEntryDate(entry.date)}</Text>
          <Text style={styles.entryMeta}>Tap to open this day</Text>
        </View>

        <View style={styles.entryMoodBadge}>
          <Text style={styles.entryMoodEmoji}>{moodToEmoji[entry.mood]}</Text>
          <Text style={styles.entryMoodLabel}>{entry.mood}</Text>
        </View>
      </View>

      <Text style={styles.entryNote}>{previewNote}</Text>
      <Text style={styles.entryTags}>{tags}</Text>
    </Pressable>
  );
}

export default function JournalScreen() {
  const router = useRouter();
  const { entries, isLoading } = useMoodEntries();
  const [selectedMood, setSelectedMood] = useState<MoodFilter>("all");
  const [selectedMonth, setSelectedMonth] = useState<MonthFilter>("all");
  const [selectedTag, setSelectedTag] = useState<string | "all">("all");

  const monthOptions = useMemo(() => {
    return Array.from(new Set(entries.map((entry) => getMonthKey(entry.date))));
  }, [entries]);

  const tagOptions = useMemo(() => {
    const pool = selectedMonth === "all"
      ? entries
      : entries.filter((entry) => getMonthKey(entry.date) === selectedMonth);

    return Array.from(
      new Set(
        pool.flatMap((entry) => entry.tags ?? [])
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [entries, selectedMonth]);

  useEffect(() => {
    if (selectedTag === "all") return;
    if (tagOptions.includes(selectedTag)) return;
    setSelectedTag("all");
  }, [selectedTag, tagOptions]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (selectedMood !== "all" && entry.mood !== selectedMood) return false;
      if (selectedMonth !== "all" && getMonthKey(entry.date) !== selectedMonth) return false;
      if (selectedTag !== "all" && !(entry.tags ?? []).includes(selectedTag)) return false;
      return true;
    });
  }, [entries, selectedMood, selectedMonth, selectedTag]);

  const hasEntries = entries.length > 0;
  const hasFilters = selectedMood !== "all" || selectedMonth !== "all" || selectedTag !== "all";
  const entryLabel = filteredEntries.length === 1 ? "entry" : "entries";

  const listHeader = (
    <View style={styles.headerWrap}>
      <Text style={styles.title}>Journal</Text>
      <Text style={styles.subtitle}>
        Browse your past check-ins, filter them, and reopen any day when you want to revisit it.
      </Text>

      <FilterSection title="Mood">
        <FilterChip label="All" active={selectedMood === "all"} onPress={() => setSelectedMood("all")} />
        {(["happy", "neutral", "sad", "angry", "anxious"] as const).map((mood) => (
          <FilterChip
            key={mood}
            label={`${moodToEmoji[mood]} ${mood}`}
            active={selectedMood === mood}
            onPress={() => setSelectedMood(mood)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Month">
        <FilterChip label="All" active={selectedMonth === "all"} onPress={() => setSelectedMonth("all")} />
        {monthOptions.map((monthKey) => (
          <FilterChip
            key={monthKey}
            label={formatMonthLabel(monthKey)}
            active={selectedMonth === monthKey}
            onPress={() => setSelectedMonth(monthKey)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Tag">
        <FilterChip label="All" active={selectedTag === "all"} onPress={() => setSelectedTag("all")} />
        {tagOptions.map((tag) => (
          <FilterChip
            key={tag}
            label={`#${tag}`}
            active={selectedTag === tag}
            onPress={() => setSelectedTag(tag)}
          />
        ))}
      </FilterSection>

      <Text style={styles.resultCount}>
        {filteredEntries.length} {entryLabel}
        {hasFilters ? " matching your filters" : " saved"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Loading your history...</Text>
          <Text style={styles.stateText}>Pulling together your saved check-ins.</Text>
        </View>
      ) : !hasEntries ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>No entries yet</Text>
          <Text style={styles.stateText}>
            Start logging moods on the Home tab and your reflections will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.date}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <EntryCard
              entry={item}
              onPress={() =>
                router.push({
                  pathname: "/",
                  params: { date: item.date, view: "day" },
                })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyResults}>
              <Text style={styles.stateTitle}>No matching entries</Text>
              <Text style={styles.stateText}>
                Try a different mood, month, or tag filter to widen the results.
              </Text>
              {hasFilters ? (
                <Pressable
                  onPress={() => {
                    setSelectedMood("all");
                    setSelectedMonth("all");
                    setSelectedTag("all");
                  }}
                  style={styles.resetButton}
                >
                  <Text style={styles.resetButtonText}>Clear filters</Text>
                </Pressable>
              ) : null}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  headerWrap: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedText,
    lineHeight: 22,
  },
  resultCount: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: -2,
  },
  filterSection: {
    gap: spacing.sm,
  },
  filterTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  chipRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  chipInactive: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  chipTextInactive: {
    color: colors.text,
  },
  entryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    shadowColor: "#111827",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 2,
  },
  entryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  entryDateWrap: {
    flex: 1,
    gap: 4,
  },
  entryDate: {
    ...typography.subtitle,
    color: colors.text,
  },
  entryMeta: {
    ...typography.caption,
    color: colors.mutedText,
  },
  entryMoodBadge: {
    minWidth: 88,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    gap: 2,
  },
  entryMoodEmoji: {
    fontSize: 20,
  },
  entryMoodLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    textTransform: "capitalize",
  },
  entryNote: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  entryTags: {
    ...typography.caption,
    color: "#4B5563",
    lineHeight: 18,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  stateText: {
    ...typography.body,
    color: colors.mutedText,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyResults: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    alignItems: "center",
  },
  resetButton: {
    marginTop: spacing.xs,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#111827",
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
