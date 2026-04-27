import { useMoodEntries } from "@/hooks";
import { colors, radius, spacing, typography } from "@/styles";
import type { Mood } from "@/types";
import {
  countLoggedDaysInMonth,
  countLoggedDaysInWeek,
  getLongestMoodStreak,
  getMoodStreak,
  getMonthSummary,
  getMostCommonMood,
  getTopTags,
  getTopTagsForMoods,
  getWeekSummary,
  getWeekdayInsights,
  type MoodSummary,
} from "@/utils/moodStats";
import { moodToEmoji } from "@/utils/moodUi";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MOOD_ORDER: Mood[] = ["happy", "neutral", "sad", "anxious", "angry"];

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryHint}>{hint}</Text>
    </View>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function MoodBars({
  summary,
  emptyLabel,
}: {
  summary: MoodSummary;
  emptyLabel: string;
}) {
  const max = Math.max(...Object.values(summary));

  if (max === 0) {
    return (
      <View style={styles.emptyPanel}>
        <Text style={styles.emptyPanelText}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.barsWrap}>
      {MOOD_ORDER.map((mood) => {
        const count = summary[mood];
        const width = max > 0 ? `${Math.max(12, (count / max) * 100)}%` : "12%";

        return (
          <View key={mood} style={styles.barRow}>
            <View style={styles.barLabelWrap}>
              <Text style={styles.barEmoji}>{moodToEmoji[mood]}</Text>
              <Text style={styles.barLabel}>{mood}</Text>
            </View>

            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width }]} />
            </View>

            <Text style={styles.barValue}>{count}</Text>
          </View>
        );
      })}
    </View>
  );
}

function TagList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: { tag: string; count: number }[];
  emptyLabel: string;
}) {
  return (
    <View style={styles.tagBlock}>
      <Text style={styles.tagBlockTitle}>{title}</Text>

      {items.length === 0 ? (
        <Text style={styles.tagEmptyText}>{emptyLabel}</Text>
      ) : (
        <View style={styles.tagWrap}>
          {items.map((item) => (
            <View key={item.tag} style={styles.tagPill}>
              <Text style={styles.tagPillText}>{`#${item.tag}`}</Text>
              <Text style={styles.tagPillCount}>{item.count}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function getReflectionLines(args: {
  entriesCount: number;
  currentStreak: number;
  topTags: { tag: string; count: number }[];
  hardDayTags: { tag: string; count: number }[];
  mostCommonMood: { mood: Mood | null; count: number };
}) {
  const lines: string[] = [];

  if (args.entriesCount < 4) {
    lines.push("Log a few more days to unlock stronger pattern signals.");
  }

  if (args.currentStreak >= 3) {
    lines.push(`You are building consistency with a ${args.currentStreak}-day check-in streak.`);
  }

  if (args.mostCommonMood.mood) {
    lines.push(
      `${moodToEmoji[args.mostCommonMood.mood]} ${args.mostCommonMood.mood} is your most common logged mood so far.`
    );
  }

  if (args.topTags[0]) {
    lines.push(`Your most common context tag right now is #${args.topTags[0].tag}.`);
  }

  if (args.hardDayTags[0]) {
    lines.push(
      `On harder days, #${args.hardDayTags[0].tag} shows up the most. That may be worth watching closely.`
    );
  }

  return lines.slice(0, 4);
}

export default function InsightsScreen() {
  const today = useMemo(() => new Date(), []);
  const thisMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today]
  );
  const { entries, map, isLoading } = useMoodEntries();

  const entriesThisWeek = useMemo(() => countLoggedDaysInWeek(map, today), [map, today]);
  const entriesThisMonth = useMemo(() => countLoggedDaysInMonth(map, thisMonth), [map, thisMonth]);
  const currentStreak = useMemo(() => {
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;
    return getMoodStreak(map, todayKey);
  }, [map, today]);
  const longestStreak = useMemo(() => getLongestMoodStreak(entries), [entries]);
  const mostCommonMood = useMemo(() => getMostCommonMood(entries), [entries]);
  const weekSummary = useMemo(() => getWeekSummary(map, today), [map, today]);
  const monthSummary = useMemo(() => getMonthSummary(map, thisMonth), [map, thisMonth]);
  const topTags = useMemo(() => getTopTags(entries), [entries]);
  const hardDayTags = useMemo(
    () => getTopTagsForMoods(entries, ["sad", "anxious", "angry"]),
    [entries]
  );
  const weekdayInsights = useMemo(() => getWeekdayInsights(entries), [entries]);

  const bestWeekday = weekdayInsights[0] ?? null;
  const hardestWeekday = weekdayInsights.length > 0 ? weekdayInsights[weekdayInsights.length - 1] : null;
  const reflectionLines = useMemo(
    () =>
      getReflectionLines({
        entriesCount: entries.length,
        currentStreak,
        topTags,
        hardDayTags,
        mostCommonMood,
      }),
    [entries.length, currentStreak, topTags, hardDayTags, mostCommonMood]
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Loading insights...</Text>
          <Text style={styles.stateText}>Turning your check-ins into a clearer picture.</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>No insights yet</Text>
          <Text style={styles.stateText}>
            Log a few moods first and this tab will start showing trends, tags, and reflection cues.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.title}>Insights</Text>
            <Text style={styles.subtitle}>
              A quick look at your recent rhythm, what keeps showing up, and where your mood patterns are leaning.
            </Text>
          </View>

          <View style={styles.summaryGrid}>
            <SummaryCard label="This week" value={`${entriesThisWeek}`} hint="days logged" />
            <SummaryCard label="This month" value={`${entriesThisMonth}`} hint="days logged" />
            <SummaryCard label="Current streak" value={`${currentStreak}`} hint="days in a row" />
            <SummaryCard label="Longest streak" value={`${longestStreak}`} hint="best run so far" />
          </View>

          <View style={styles.highlightCard}>
            <Text style={styles.highlightLabel}>Most common mood</Text>
            <Text style={styles.highlightValue}>
              {mostCommonMood.mood ? `${moodToEmoji[mostCommonMood.mood]} ${mostCommonMood.mood}` : "Not enough data"}
            </Text>
            <Text style={styles.highlightHint}>
              {mostCommonMood.count > 0
                ? `${mostCommonMood.count} check-ins so far`
                : "Keep logging to reveal a stronger trend"}
            </Text>
          </View>

          <Section title="Mood snapshots" subtitle="How your recent check-ins are distributed.">
            <View style={styles.dualPanel}>
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>This week</Text>
                <MoodBars summary={weekSummary} emptyLabel="No moods logged yet this week." />
              </View>

              <View style={styles.panel}>
                <Text style={styles.panelTitle}>This month</Text>
                <MoodBars summary={monthSummary} emptyLabel="No moods logged yet this month." />
              </View>
            </View>
          </Section>

          <Section title="Tag patterns" subtitle="What contexts keep showing up in your logs.">
            <TagList
              title="Top tags overall"
              items={topTags}
              emptyLabel="Add tags to your entries and patterns will show up here."
            />
            <TagList
              title="Top tags on harder days"
              items={hardDayTags}
              emptyLabel="Log tags on sad, anxious, or angry days to surface tougher patterns."
            />
          </Section>

          <Section
            title="Weekday rhythm"
            subtitle="Shown after at least two entries on a weekday so the signal is a little more trustworthy."
          >
            {weekdayInsights.length === 0 ? (
              <View style={styles.emptyPanel}>
                <Text style={styles.emptyPanelText}>
                  Not enough repeated weekday data yet. Keep checking in and this section will get smarter.
                </Text>
              </View>
            ) : (
              <View style={styles.weekdayCard}>
                {bestWeekday ? (
                  <View style={styles.weekdayRow}>
                    <Text style={styles.weekdayLabel}>Best average day</Text>
                    <Text style={styles.weekdayValue}>
                      {bestWeekday.label} · {bestWeekday.count} entries
                    </Text>
                  </View>
                ) : null}

                {hardestWeekday ? (
                  <View style={styles.weekdayRow}>
                    <Text style={styles.weekdayLabel}>Toughest average day</Text>
                    <Text style={styles.weekdayValue}>
                      {hardestWeekday.label} · {hardestWeekday.count} entries
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </Section>

          <Section title="Reflection cues" subtitle="A few simple takeaways from what has been logged so far.">
            <View style={styles.reflectionCard}>
              {reflectionLines.map((line) => (
                <Text key={line} style={styles.reflectionLine}>
                  • {line}
                </Text>
              ))}
            </View>
          </Section>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  hero: {
    gap: spacing.sm,
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
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryCard: {
    width: "48%",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  summaryHint: {
    ...typography.caption,
    color: colors.mutedText,
  },
  highlightCard: {
    backgroundColor: "#EAF0FF",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#C9D7FF",
    padding: spacing.lg,
    gap: 6,
  },
  highlightLabel: {
    ...typography.caption,
    color: "#4B5563",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  highlightValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    textTransform: "capitalize",
  },
  highlightHint: {
    ...typography.body,
    color: colors.mutedText,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.mutedText,
    lineHeight: 22,
  },
  dualPanel: {
    gap: spacing.md,
  },
  panel: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  panelTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  barsWrap: {
    gap: spacing.sm,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  barLabelWrap: {
    width: 98,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  barEmoji: {
    fontSize: 16,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    textTransform: "capitalize",
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#9DB4FF",
  },
  barValue: {
    width: 24,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  tagBlock: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tagBlockTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#D6E0FF",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  tagPillCount: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4B5563",
  },
  tagEmptyText: {
    ...typography.body,
    color: colors.mutedText,
    lineHeight: 22,
  },
  weekdayCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  weekdayLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
  },
  weekdayValue: {
    ...typography.caption,
    color: colors.mutedText,
  },
  reflectionCard: {
    backgroundColor: "#FFF8E8",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#F6DFA6",
    padding: spacing.md,
    gap: spacing.sm,
  },
  reflectionLine: {
    ...typography.body,
    color: "#5B4636",
    lineHeight: 22,
  },
  emptyPanel: {
    backgroundColor: "#F8FAFC",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyPanelText: {
    ...typography.body,
    color: colors.mutedText,
    lineHeight: 22,
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
});
