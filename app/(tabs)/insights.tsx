import { useMoodEntries } from "@/hooks";
import { colors, radius, spacing, typography } from "@/styles";
import type { Mood } from "@/types";
import {
  countLoggedDaysInMonth,
  countLoggedDaysInWeek,
  getComboHighlights,
  getContextCoverage,
  getContextSignals,
  getEntriesForWeek,
  getLongestMoodStreak,
  getMoodStreak,
  getMonthSummary,
  getMostCommonMood,
  getTopChallengingTags,
  getTopSupportiveTags,
  getTopTags,
  getTopTagsForMoods,
  getWeekComparison,
  getWeekSummary,
  getWeekdayInsights,
  type ComboHighlight,
  type ContextCoverage,
  type ContextSignal,
  type MoodSummary,
} from "@/utils/moodStats";
import { moodToEmoji } from "@/utils/moodUi";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MOOD_ORDER: Mood[] = ["happy", "neutral", "sad", "anxious", "angry"];

function SummaryPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryPill}>
      <Text style={styles.summaryPillLabel}>{label}</Text>
      <Text style={styles.summaryPillValue}>{value}</Text>
    </View>
  );
}

function StoryCard({
  eyebrow,
  title,
  body,
  tone = "default",
}: {
  eyebrow: string;
  title: string;
  body: string;
  tone?: "default" | "warm" | "cool";
}) {
  return (
    <View
      style={[
        styles.storyCard,
        tone === "warm" ? styles.storyCardWarm : null,
        tone === "cool" ? styles.storyCardCool : null,
      ]}
    >
      <Text style={styles.storyEyebrow}>{eyebrow}</Text>
      <Text style={styles.storyTitle}>{title}</Text>
      <Text style={styles.storyBody}>{body}</Text>
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
      <View style={styles.supportCard}>
        <Text style={styles.supportEmptyText}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.supportCard}>
      <View style={styles.barsWrap}>
        {MOOD_ORDER.map((mood) => {
          const count = summary[mood];
          const width = (max > 0
            ? `${Math.max(12, (count / max) * 100)}%`
            : "12%") as `${number}%`;

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
    </View>
  );
}

function TagPills({
  items,
  emptyLabel,
}: {
  items: { tag: string; count: number }[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <View style={styles.supportCard}>
        <Text style={styles.supportEmptyText}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.supportCard}>
      <View style={styles.tagWrap}>
        {items.map((item) => (
          <View key={item.tag} style={styles.tagPill}>
            <Text style={styles.tagPillText}>{`#${item.tag}`}</Text>
            <Text style={styles.tagPillCount}>{item.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function describeDeltaStrength(delta: number) {
  const absolute = Math.abs(delta);
  if (absolute >= 0.9) return "noticeably";
  if (absolute >= 0.5) return "clearly";
  return "slightly";
}

function formatContextFeatureLabel(feature: string) {
  if (feature.startsWith("tag:")) return `#${feature.slice(4)}`;

  const [level, rawKey] = feature.split("_");
  const key = rawKey === "sleep" ? "sleep" : rawKey === "stress" ? "stress" : "energy";

  if (level === "high") return `high ${key}`;
  return `low ${key}`;
}

function getCoverageLabel(key: ContextCoverage["key"]) {
  if (key === "sleep") return "sleep";
  if (key === "stress") return "stress";
  return "energy";
}

function formatScoreShift(delta: number | null) {
  if (delta == null) return null;
  if (delta >= 0.8) return "noticeably lighter";
  if (delta >= 0.35) return "slightly lighter";
  if (delta <= -0.8) return "noticeably heavier";
  if (delta <= -0.35) return "slightly heavier";
  return "pretty similar";
}

function describeContextSignal(signal: ContextSignal) {
  if (signal.delta == null) return null;

  if (signal.key === "stress") {
    if (signal.delta <= -0.6) {
      return "Higher-stress days tend to land noticeably worse than calmer days.";
    }
    if (signal.delta <= -0.3) {
      return "Higher-stress days tend to be a bit harder than calmer days.";
    }
  }

  if (signal.key === "sleep") {
    if (signal.delta >= 0.6) {
      return "Better-sleep days tend to feel noticeably better than poor-sleep days.";
    }
    if (signal.delta >= 0.3) {
      return "Better-sleep days tend to feel a bit better than poor-sleep days.";
    }
  }

  if (signal.key === "energy") {
    if (signal.delta >= 0.6) {
      return "Higher-energy days tend to feel noticeably better than low-energy days.";
    }
    if (signal.delta >= 0.3) {
      return "Higher-energy days tend to feel a bit better than low-energy days.";
    }
  }

  return null;
}

function describeContextCoverage(coverage: ContextCoverage) {
  const label = getCoverageLabel(coverage.key);

  if (coverage.enoughThisWeek) {
    return `You logged ${coverage.thisWeekCount} ${label} signals this week, which is enough to start trusting a short-term pattern.`;
  }

  if (coverage.thisWeekCount === 0) {
    return `You have not logged any ${label} context this week yet, so that pattern is still blank.`;
  }

  return `You haven't logged enough ${label} data this week for a strong pattern yet.`;
}

function describeComboHighlight(combo: ComboHighlight) {
  const [first, second] = combo.features.map(formatContextFeatureLabel);
  const strength = describeDeltaStrength(combo.deltaFromBaseline);

  if (combo.tone === "challenging") {
    return {
      title: `${capitalize(first)} + ${second} often clusters around tougher days.`,
      body: `That pair shows up ${combo.count} times in your logs and trends ${strength} worse than your baseline.`,
    };
  }

  return {
    title: `${capitalize(first)} + ${second} tends to show up on your better days.`,
    body: `That pair appears ${combo.count} times and trends ${strength} better than your baseline.`,
  };
}

function getWeekStory(args: {
  weekCount: number;
  currentStreak: number;
  comparison: ReturnType<typeof getWeekComparison>;
  mostCommonMood: { mood: Mood | null; count: number };
}) {
  const shift = formatScoreShift(args.comparison.delta);

  if (args.weekCount < 3) {
    return {
      title: "This week is still taking shape.",
      body:
        args.currentStreak > 0
          ? `You have ${args.weekCount} check-ins so far and a ${args.currentStreak}-day streak. A few more entries will make the weekly pattern more trustworthy.`
          : `You have ${args.weekCount} check-ins so far. A few more entries will make the weekly pattern more trustworthy.`,
    };
  }

  if (shift && args.comparison.previousCount >= 3) {
    return {
      title: `This week feels ${shift} than last week.`,
      body:
        args.mostCommonMood.mood != null
          ? `You logged ${args.weekCount} days this week. ${args.mostCommonMood.mood} has been your most common mood overall so far.`
          : `You logged ${args.weekCount} days this week and now have enough data for a real week-over-week comparison.`,
    };
  }

  return {
    title: "You are building a useful weekly baseline.",
    body:
      args.currentStreak >= 3
        ? `You checked in ${args.weekCount} times this week and kept a ${args.currentStreak}-day streak going.`
        : `You checked in ${args.weekCount} times this week, which is enough to start seeing early patterns.`,
  };
}

function getPatternStory(args: {
  challengingTag?: { tag: string; count: number };
  supportiveTag?: { tag: string; count: number };
  primaryContextLine?: string | null;
  bestWeekdayLabel?: string | null;
}) {
  if (args.challengingTag && args.supportiveTag) {
    return {
      title: `#${args.challengingTag.tag} shows up on tougher days, while #${args.supportiveTag.tag} tends to show up on better ones.`,
      body: "That is the clearest trigger-versus-helper pattern in your logs right now.",
    };
  }

  if (args.challengingTag) {
    return {
      title: `#${args.challengingTag.tag} keeps showing up around lower moods.`,
      body:
        args.primaryContextLine ??
        "That does not prove cause, but it is a pattern worth watching the next time that tag appears.",
    };
  }

  if (args.supportiveTag) {
    return {
      title: `Days tagged #${args.supportiveTag.tag} tend to go better for you.`,
      body:
        args.bestWeekdayLabel != null
          ? `${args.bestWeekdayLabel}s are also one of your better days, which may be part of the same rhythm.`
          : "That looks like one of your more reliable support signals so far.",
    };
  }

  if (args.primaryContextLine) {
    return {
      title: "Your context signals are starting to tell a story.",
      body: args.primaryContextLine,
    };
  }

  return {
    title: "The pattern layer is just starting to form.",
    body: "Keep adding tags, quick notes, and context signals so the app can connect moods to what was happening around them.",
  };
}

function getActionStory(args: {
  challengingTag?: { tag: string; count: number };
  supportiveTag?: { tag: string; count: number };
  strongestContext?: ContextSignal | null;
}) {
  if (args.challengingTag && args.supportiveTag) {
    return {
      title: `Try adding #${args.supportiveTag.tag} earlier on #${args.challengingTag.tag} days.`,
      body: `A small experiment for this week: when a day is already shaping up like #${args.challengingTag.tag}, add even a short version of #${args.supportiveTag.tag} instead of waiting until the day feels rough.`,
    };
  }

  if (args.strongestContext?.key === "stress" && (args.strongestContext.delta ?? 0) <= -0.3) {
    return {
      title: "Protect a reset before stress peaks.",
      body: "High-stress days look harder in your logs. Try a very small interruption before stress stacks up: a short walk, water, music, or ten quiet minutes.",
    };
  }

  if (args.strongestContext?.key === "sleep" && (args.strongestContext.delta ?? 0) >= 0.3) {
    return {
      title: "Guard sleep before busy days.",
      body: "Your better-sleep days trend better. A useful experiment is protecting bedtime the night before your most demanding days.",
    };
  }

  if (args.strongestContext?.key === "energy" && (args.strongestContext.delta ?? 0) >= 0.3) {
    return {
      title: "Treat low-energy days differently.",
      body: "Your higher-energy days trend better. When energy starts low, try reducing one demand instead of expecting the same pace from yourself.",
    };
  }

  if (args.supportiveTag) {
    return {
      title: `Make more room for #${args.supportiveTag.tag} before you need it.`,
      body: `That tag appears on better days often enough to be worth using intentionally, not just accidentally.`,
    };
  }

  return {
    title: "Keep the next step small and testable.",
    body: "The best action right now is consistency: keep logging, add a little context, and look for the same pattern repeating before you change too much.",
  };
}

function buildHighlightLines(args: {
  topTag?: { tag: string; count: number };
  hardDayTag?: { tag: string; count: number };
  supportiveTag?: { tag: string; count: number };
  primaryContextLine?: string | null;
  comboHighlight?: ComboHighlight | null;
  bestWeekday?: { label: string; count: number } | null;
  hardestWeekday?: { label: string; count: number } | null;
}) {
  const lines: string[] = [];

  if (args.hardDayTag) {
    lines.push(`#${args.hardDayTag.tag} is your most common tougher-day tag.`);
  }

  if (args.supportiveTag) {
    lines.push(`You tend to feel better on days with #${args.supportiveTag.tag}.`);
  }

  if (args.primaryContextLine) {
    lines.push(args.primaryContextLine);
  }

  if (args.comboHighlight) {
    const [first, second] = args.comboHighlight.features.map(formatContextFeatureLabel);
    lines.push(
      args.comboHighlight.tone === "challenging"
        ? `${capitalize(first)} + ${second} tends to show up around harder days.`
        : `${capitalize(first)} + ${second} tends to show up on better days.`
    );
  }

  if (args.bestWeekday) {
    lines.push(`${args.bestWeekday.label}s are usually one of your better days.`);
  }

  if (args.hardestWeekday && args.hardestWeekday.label !== args.bestWeekday?.label) {
    lines.push(`${args.hardestWeekday.label}s tend to be tougher for you.`);
  }

  if (lines.length < 3 && args.topTag) {
    lines.push(`#${args.topTag.tag} is the context you log most often.`);
  }

  return lines.slice(0, 5);
}

export default function InsightsScreen() {
  const today = useMemo(() => new Date(), []);
  const thisMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today]
  );
  const { entries, map, isLoading } = useMoodEntries();

  const weekCount = useMemo(() => countLoggedDaysInWeek(map, today), [map, today]);
  const monthCount = useMemo(() => countLoggedDaysInMonth(map, thisMonth), [map, thisMonth]);
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
  const supportiveTags = useMemo(() => getTopSupportiveTags(entries), [entries]);
  const challengingTags = useMemo(() => getTopChallengingTags(entries), [entries]);
  const weekdayInsights = useMemo(() => getWeekdayInsights(entries), [entries]);
  const comparison = useMemo(() => getWeekComparison(entries, today), [entries, today]);
  const contextSignals = useMemo(() => getContextSignals(entries), [entries]);
  const comboHighlights = useMemo(() => getComboHighlights(entries), [entries]);
  const currentWeekEntries = useMemo(() => getEntriesForWeek(entries, today), [entries, today]);
  const sleepCoverage = useMemo(() => getContextCoverage(entries, "sleep", today), [entries, today]);
  const stressCoverage = useMemo(() => getContextCoverage(entries, "stress", today), [entries, today]);
  const energyCoverage = useMemo(() => getContextCoverage(entries, "energy", today), [entries, today]);

  const bestWeekday = weekdayInsights[0] ?? null;
  const hardestWeekday =
    weekdayInsights.length > 1 ? weekdayInsights[weekdayInsights.length - 1] : null;
  const strongestContext = contextSignals[0] ?? null;
  const sleepSignal = contextSignals.find((signal) => signal.key === "sleep") ?? null;
  const stressSignal = contextSignals.find((signal) => signal.key === "stress") ?? null;
  const energySignal = contextSignals.find((signal) => signal.key === "energy") ?? null;
  const primaryContextLine = strongestContext ? describeContextSignal(strongestContext) : null;
  const strongestCombo = comboHighlights[0] ?? null;

  const weekStory = useMemo(
    () =>
      getWeekStory({
        weekCount,
        currentStreak,
        comparison,
        mostCommonMood,
      }),
    [weekCount, currentStreak, comparison, mostCommonMood]
  );

  const patternStory = useMemo(
    () =>
      getPatternStory({
        challengingTag: challengingTags[0],
        supportiveTag: supportiveTags[0],
        primaryContextLine,
        bestWeekdayLabel: bestWeekday?.label ?? null,
      }),
    [challengingTags, supportiveTags, primaryContextLine, bestWeekday]
  );

  const actionStory = useMemo(
    () =>
      getActionStory({
        challengingTag: challengingTags[0],
        supportiveTag: supportiveTags[0],
        strongestContext,
      }),
    [challengingTags, supportiveTags, strongestContext]
  );

  const highlightLines = useMemo(
    () =>
      buildHighlightLines({
        topTag: topTags[0],
        hardDayTag: hardDayTags[0],
        supportiveTag: supportiveTags[0],
        primaryContextLine,
        comboHighlight: strongestCombo,
        bestWeekday,
        hardestWeekday,
      }),
    [
      topTags,
      hardDayTags,
      supportiveTags,
      primaryContextLine,
      strongestCombo,
      bestWeekday,
      hardestWeekday,
    ]
  );

  const contextCards = useMemo(
    () => [
      {
        key: "sleep",
        title: "Sleep",
        headline: sleepSignal
          ? describeContextSignal(sleepSignal) ?? "Sleep is showing an early signal."
          : "Sleep does not have a strong overall signal yet.",
        detail: describeContextCoverage(sleepCoverage),
      },
      {
        key: "stress",
        title: "Stress",
        headline: stressSignal
          ? describeContextSignal(stressSignal) ?? "Stress is showing an early signal."
          : "Stress does not have a strong overall signal yet.",
        detail: describeContextCoverage(stressCoverage),
      },
      {
        key: "energy",
        title: "Energy",
        headline: energySignal
          ? describeContextSignal(energySignal) ?? "Energy is showing an early signal."
          : "Energy does not have a strong overall signal yet.",
        detail: describeContextCoverage(energyCoverage),
      },
    ],
    [sleepSignal, stressSignal, energySignal, sleepCoverage, stressCoverage, energyCoverage]
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Loading insights...</Text>
          <Text style={styles.stateText}>
            Turning your check-ins into patterns and next steps.
          </Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>No insights yet</Text>
          <Text style={styles.stateText}>
            Log a few moods first. Tags, notes, and context signals will help this tab turn raw entries into useful patterns.
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
              Stories first, numbers second. The goal is to help you notice what is happening and decide what to try next.
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <SummaryPill label="This week" value={`${weekCount} days`} />
            <SummaryPill label="This month" value={`${monthCount} days`} />
            <SummaryPill label="Streak" value={`${currentStreak}`} />
            <SummaryPill label="Best run" value={`${longestStreak}`} />
          </View>

          <StoryCard eyebrow="This week" title={weekStory.title} body={weekStory.body} />
          <StoryCard eyebrow="Pattern" title={patternStory.title} body={patternStory.body} tone="cool" />
          <StoryCard eyebrow="Try next" title={actionStory.title} body={actionStory.body} tone="warm" />

          <Section
            title="Highlights"
            subtitle="Short pattern sentences pulled from what you have actually logged."
          >
            <View style={styles.highlightsCard}>
              {highlightLines.map((line) => (
                <Text key={line} style={styles.highlightLine}>
                  {line}
                </Text>
              ))}
            </View>
          </Section>

          <Section
            title="Deeper context"
            subtitle="Signals and combinations pulled from sleep, stress, energy, tags, and recent coverage."
          >
            <View style={styles.contextInsightGrid}>
              {contextCards.map((card) => (
                <View key={card.key} style={styles.contextInsightCard}>
                  <Text style={styles.contextInsightLabel}>{card.title}</Text>
                  <Text style={styles.contextInsightHeadline}>{card.headline}</Text>
                  <Text style={styles.contextInsightBody}>{card.detail}</Text>
                </View>
              ))}
            </View>

            <View style={styles.supportBlock}>
              <Text style={styles.supportTitle}>Combination patterns</Text>
              {comboHighlights.length > 0 ? (
                <View style={styles.comboGrid}>
                  {comboHighlights.map((combo) => {
                    const description = describeComboHighlight(combo);
                    return (
                      <View key={combo.features.join("|")} style={styles.comboCard}>
                        <Text style={styles.comboTitle}>{description.title}</Text>
                        <Text style={styles.comboBody}>{description.body}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.supportCard}>
                  <Text style={styles.supportEmptyText}>
                    Keep logging tags plus sleep, stress, and energy so clearer combinations can form.
                  </Text>
                </View>
              )}
            </View>
          </Section>

          <Section
            title="Supporting details"
            subtitle="The numbers are still here, but they stay in the background."
          >
            <View style={styles.supportGrid}>
              <View style={styles.supportBlock}>
                <Text style={styles.supportTitle}>This week</Text>
                <MoodBars summary={weekSummary} emptyLabel="No moods logged yet this week." />
              </View>

              <View style={styles.supportBlock}>
                <Text style={styles.supportTitle}>This month</Text>
                <MoodBars summary={monthSummary} emptyLabel="No moods logged yet this month." />
              </View>
            </View>
          </Section>

          <Section
            title="Contexts"
            subtitle="Useful when you want to see which tags and tougher-day contexts keep repeating."
          >
            <View style={styles.supportBlock}>
              <Text style={styles.supportTitle}>Top tags overall</Text>
              <TagPills
                items={topTags}
                emptyLabel="Add tags to your entries and recurring contexts will show up here."
              />
            </View>

            <View style={styles.supportBlock}>
              <Text style={styles.supportTitle}>Common on harder days</Text>
              <TagPills
                items={hardDayTags}
                emptyLabel="Tag sad, anxious, or angry days to surface clearer tough-day patterns."
              />
            </View>

            {currentWeekEntries.length > 0 && mostCommonMood.mood ? (
              <View style={styles.supportCard}>
                <Text style={styles.supportInlineText}>
                  {`${moodToEmoji[mostCommonMood.mood]} ${mostCommonMood.mood} is your most common mood so far, with ${mostCommonMood.count} check-ins.`}
                </Text>
              </View>
            ) : null}
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
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryPill: {
    minWidth: "47%",
    backgroundColor: "#F4F7FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCE5FA",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 3,
  },
  summaryPillLabel: {
    ...typography.caption,
    color: colors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryPillValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  storyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  storyCardWarm: {
    backgroundColor: "#FFF7E8",
    borderColor: "#F3D9A3",
  },
  storyCardCool: {
    backgroundColor: "#EEF4FF",
    borderColor: "#CDDDFD",
  },
  storyEyebrow: {
    ...typography.caption,
    color: colors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  storyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 30,
  },
  storyBody: {
    ...typography.body,
    color: colors.mutedText,
    lineHeight: 24,
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
  highlightsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  highlightLine: {
    ...typography.body,
    color: colors.text,
    lineHeight: 23,
  },
  supportGrid: {
    gap: spacing.md,
  },
  contextInsightGrid: {
    gap: spacing.md,
  },
  contextInsightCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  contextInsightLabel: {
    ...typography.caption,
    color: colors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contextInsightHeadline: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 24,
  },
  contextInsightBody: {
    ...typography.body,
    color: colors.mutedText,
    lineHeight: 22,
  },
  comboGrid: {
    gap: spacing.md,
  },
  comboCard: {
    backgroundColor: "#F9FBFF",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#DCE5FA",
    padding: spacing.md,
    gap: spacing.xs,
  },
  comboTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 24,
  },
  comboBody: {
    ...typography.body,
    color: colors.mutedText,
    lineHeight: 22,
  },
  supportBlock: {
    gap: spacing.sm,
  },
  supportTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  supportCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  supportInlineText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  supportEmptyText: {
    ...typography.body,
    color: colors.mutedText,
    lineHeight: 22,
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
