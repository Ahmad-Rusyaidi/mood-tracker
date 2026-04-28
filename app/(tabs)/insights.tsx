import { useMoodEntries } from "@/hooks";
import { colors, spacing, typography } from "@/styles";
import type { Mood, MoodContextKey } from "@/types";
import {
  countLoggedDaysInMonth,
  countLoggedDaysInWeek,
  getComboHighlights,
  getContextCoverage,
  getContextSignals,
  getLongestMoodStreak,
  getMonthComparison,
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
  type TagAssociation,
} from "@/utils/moodStats";
import { moodToEmoji } from "@/utils/moodUi";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MOOD_ORDER: Mood[] = ["happy", "neutral", "sad", "anxious", "angry"];
const WEEKDAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const MOOD_BAR_COLORS: Record<Mood, string> = {
  happy: "#F8C858",
  neutral: "#72C18C",
  sad: "#7FB5FF",
  anxious: "#B297F4",
  angry: "#F28B82",
};

type PatternCardData = {
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "cool" | "warm";
};

type EvidenceCardData = {
  label: string;
  title: string;
  detail: string;
  tag: string;
  tone: "supportive" | "challenging";
};

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function HeroCard({
  eyebrow,
  title,
  body,
  action,
  mood,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action?: string;
  mood?: Mood | null;
}) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroTopRow}>
        <Text style={styles.heroEyebrow}>{eyebrow}</Text>
        {mood ? (
          <View style={styles.heroMoodBadge}>
            <Text style={styles.heroMoodEmoji}>{moodToEmoji[mood]}</Text>
            <Text style={styles.heroMoodText}>{mood}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroBody}>{body}</Text>

      {action ? (
        <View style={styles.heroActionPill}>
          <Text style={styles.heroActionText}>{action}</Text>
        </View>
      ) : null}
    </View>
  );
}

function CompareCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.compareCard}>
      <Text style={styles.compareEyebrow}>{eyebrow}</Text>
      <Text style={styles.compareTitle}>{title}</Text>
      <Text style={styles.compareBody}>{body}</Text>
    </View>
  );
}

function StatCard({
  label,
  value,
  note,
  compact,
}: {
  label: string;
  value: string;
  note?: string;
  compact: boolean;
}) {
  return (
    <View style={[styles.statCard, compact ? styles.halfCard : styles.fullCard]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {note ? <Text style={styles.statNote}>{note}</Text> : null}
    </View>
  );
}

function PatternCard({
  label,
  value,
  detail,
  tone,
  compact,
}: PatternCardData & { compact: boolean }) {
  return (
    <View
      style={[
        styles.patternCard,
        compact ? styles.halfCard : styles.fullCard,
        tone === "cool" ? styles.patternCardCool : null,
        tone === "warm" ? styles.patternCardWarm : null,
      ]}
    >
      <Text style={styles.patternLabel}>{label}</Text>
      <Text style={styles.patternValue}>{value}</Text>
      <Text style={styles.patternDetail}>{detail}</Text>
    </View>
  );
}

function EvidenceCard({
  label,
  title,
  detail,
  tone,
  onPress,
}: EvidenceCardData & { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.evidenceCard,
        tone === "supportive" ? styles.evidenceCardSupportive : styles.evidenceCardChallenging,
      ]}
    >
      <Text style={styles.evidenceLabel}>{label}</Text>
      <Text style={styles.evidenceTitle}>{title}</Text>
      <Text style={styles.evidenceDetail}>{detail}</Text>
      <View style={styles.evidenceButton}>
        <Text style={styles.evidenceButtonText}>View matching days</Text>
      </View>
    </Pressable>
  );
}

function SignalCard({
  title,
  signal,
  coverage,
  onPress,
}: {
  title: string;
  signal: ContextSignal | null;
  coverage: ContextCoverage;
  onPress?: (() => void) | null;
}) {
  const meterValue = getSignalMeterValue(signal);
  const shiftLabel = getSignalShiftLabel(signal);
  const summary = getSignalSummary(signal, coverage);

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress ?? undefined}
      style={[styles.signalCard, onPress ? styles.signalCardPressable : null]}
    >
      <View style={styles.signalTopRow}>
        <Text style={styles.signalTitle}>{title}</Text>
        <Text style={styles.signalShift}>{shiftLabel}</Text>
      </View>

      <View style={styles.signalTrack}>
        <View style={styles.signalTrackMid} />
        <View
          style={[
            styles.signalThumb,
            {
              left: `${meterValue * 100}%`,
              backgroundColor:
                signal?.delta != null && signal.delta < 0 ? "#F28B82" : "#7EB6FF",
            },
          ]}
        />
      </View>

      <View style={styles.signalMetaRow}>
        <Text style={styles.signalMetaText}>{`${coverage.thisWeekCount} this week`}</Text>
        <Text style={styles.signalMetaText}>
          {signal ? `${signal.lowCount} low / ${signal.highCount} high` : "not much yet"}
        </Text>
      </View>

      <Text style={styles.signalSummary}>{summary}</Text>

      {onPress ? (
        <View style={styles.signalLinkPill}>
          <Text style={styles.signalLinkText}>View matching days</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function MoodMixStripCard({
  title,
  summary,
}: {
  title: string;
  summary: MoodSummary;
}) {
  const total = Object.values(summary).reduce((sum, value) => sum + value, 0);

  return (
    <View style={styles.stripCard}>
      <Text style={styles.stripTitle}>{title}</Text>

      {total === 0 ? (
        <Text style={styles.emptyText}>No moods logged yet.</Text>
      ) : (
        <>
          <View style={styles.mixStrip}>
            {MOOD_ORDER.filter((mood) => summary[mood] > 0).map((mood) => (
              <View
                key={mood}
                style={[
                  styles.mixStripSegment,
                  {
                    flex: summary[mood],
                    backgroundColor: MOOD_BAR_COLORS[mood],
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.mixLegendRow}>
            {MOOD_ORDER.filter((mood) => summary[mood] > 0).map((mood) => (
              <View key={mood} style={styles.mixLegendItem}>
                <View
                  style={[
                    styles.mixLegendDot,
                    { backgroundColor: MOOD_BAR_COLORS[mood] },
                  ]}
                />
                <Text style={styles.mixLegendText}>{`${moodToEmoji[mood]} ${summary[mood]}`}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function WeekdayRhythmCard({
  items,
}: {
  items: ReturnType<typeof getWeekdayInsights>;
}) {
  const byWeekday = new Map(items.map((item) => [item.label, item]));

  return (
    <View style={styles.stripCard}>
      <Text style={styles.stripTitle}>Weekday rhythm</Text>
      <View style={styles.weekdayChart}>
        {WEEKDAY_ORDER.map((label) => {
          const item = byWeekday.get(label);
          const height = item ? Math.max(14, (item.averageScore / 5) * 72) : 10;

          return (
            <View key={label} style={styles.weekdayCol}>
              <Text style={styles.weekdayCount}>{item ? item.count : ""}</Text>
              <View style={styles.weekdayTrack}>
                <View
                  style={[
                    styles.weekdayBar,
                    {
                      height,
                      backgroundColor: item ? "#8DB2FF" : "#D8E2F6",
                    },
                  ]}
                />
              </View>
              <Text style={styles.weekdayLabel}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MoodMixCard({
  title,
  summary,
  compact,
}: {
  title: string;
  summary: MoodSummary;
  compact: boolean;
}) {
  const max = Math.max(...Object.values(summary));

  return (
    <View style={[styles.detailCard, compact ? styles.halfCard : styles.fullCard]}>
      <Text style={styles.detailCardTitle}>{title}</Text>

      {max === 0 ? (
        <Text style={styles.emptyText}>No moods logged yet.</Text>
      ) : (
        <View style={styles.barsWrap}>
          {MOOD_ORDER.map((mood) => {
            const count = summary[mood];
            const width = `${Math.max(10, (count / max) * 100)}%` as `${number}%`;

            return (
              <View key={mood} style={styles.barRow}>
                <View style={styles.barLabelWrap}>
                  <Text style={styles.barEmoji}>{moodToEmoji[mood]}</Text>
                  <Text style={styles.barLabel}>{mood}</Text>
                </View>

                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width,
                        backgroundColor: MOOD_BAR_COLORS[mood],
                      },
                    ]}
                  />
                </View>

                <Text style={styles.barValue}>{count}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function TagListCard({
  title,
  items,
  emptyLabel,
  compact,
}: {
  title: string;
  items: { tag: string; count: number }[];
  emptyLabel: string;
  compact: boolean;
}) {
  return (
    <View style={[styles.detailCard, compact ? styles.halfCard : styles.fullCard]}>
      <Text style={styles.detailCardTitle}>{title}</Text>

      {items.length === 0 ? (
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      ) : (
        <View style={styles.tagWrap}>
          {items.map((item) => (
            <View key={item.tag} style={styles.tagPill}>
              <Text style={styles.tagText}>{`#${item.tag}`}</Text>
              <Text style={styles.tagCount}>{item.count}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatContextFeatureLabel(feature: string) {
  if (feature.startsWith("tag:")) return `#${feature.slice(4)}`;

  const [level, rawKey] = feature.split("_");
  const key =
    rawKey === "sleep" ? "sleep" : rawKey === "stress" ? "stress" : "energy";

  return level === "high" ? `high ${key}` : `low ${key}`;
}

function formatScoreShift(delta: number | null) {
  if (delta == null) return null;
  if (delta >= 0.8) return "noticeably lighter";
  if (delta >= 0.35) return "slightly lighter";
  if (delta <= -0.8) return "noticeably heavier";
  if (delta <= -0.35) return "slightly heavier";
  return "pretty similar";
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
          ? `${args.weekCount} check-ins so far, with a ${args.currentStreak}-day streak still going.`
          : `${args.weekCount} check-ins so far. A few more will sharpen the picture.`,
    };
  }

  if (shift && args.comparison.previousCount >= 3) {
    return {
      title: `This week feels ${shift} than last week.`,
      body:
        args.mostCommonMood.mood != null
          ? `${capitalize(args.mostCommonMood.mood)} has been your most common mood overall.`
          : "You now have enough check-ins to compare this week with last week.",
    };
  }

  return {
    title: "You are building a useful weekly baseline.",
    body:
      args.currentStreak >= 3
        ? `${args.weekCount} check-ins this week, and your streak is still intact.`
        : `${args.weekCount} check-ins this week is enough to start spotting early patterns.`,
  };
}

function getActionStory(args: {
  challengingTag?: { tag: string; count: number };
  supportiveTag?: { tag: string; count: number };
  strongestContext?: ContextSignal | null;
}) {
  if (args.challengingTag && args.supportiveTag) {
    return `Try adding #${args.supportiveTag.tag} earlier on #${args.challengingTag.tag} days.`;
  }

  if (args.strongestContext?.key === "stress" && (args.strongestContext.delta ?? 0) <= -0.3) {
    return "Protect a reset before stress peaks.";
  }

  if (args.strongestContext?.key === "sleep" && (args.strongestContext.delta ?? 0) >= 0.3) {
    return "Guard sleep before your busiest days.";
  }

  if (args.strongestContext?.key === "energy" && (args.strongestContext.delta ?? 0) >= 0.3) {
    return "Treat low-energy days differently instead of pushing the same pace.";
  }

  if (args.supportiveTag) {
    return `Make a bit more room for #${args.supportiveTag.tag} this week.`;
  }

  return "Keep the next step small and testable.";
}

function getMonthStory(args: {
  monthCount: number;
  comparison: ReturnType<typeof getMonthComparison>;
  mostCommonMood: { mood: Mood | null; count: number };
}) {
  const shift = formatScoreShift(args.comparison.delta);

  if (args.monthCount < 6) {
    return {
      title: "This month is still early.",
      body: `${args.monthCount} check-ins so far. A few more will make the monthly picture clearer.`,
    };
  }

  if (shift && args.comparison.previousCount >= 6) {
    return {
      title: `This month feels ${shift} than last month.`,
      body:
        args.mostCommonMood.mood != null
          ? `${capitalize(args.mostCommonMood.mood)} has been your most common mood this month.`
          : "There is enough here now for a month-to-month comparison.",
    };
  }

  return {
    title: "Your monthly baseline is starting to settle.",
    body: `${args.monthCount} check-ins this month is enough to start noticing broader patterns.`,
  };
}

function buildPatternCards(args: {
  topTag?: { tag: string; count: number };
  challengingTag?: { tag: string; count: number };
  supportiveTag?: { tag: string; count: number };
  bestWeekday?: { label: string; count: number } | null;
  strongestCombo?: ComboHighlight | null;
  mostCommonMood: { mood: Mood | null; count: number };
}) {
  const cards: PatternCardData[] = [];

  if (args.supportiveTag) {
    cards.push({
      label: "Best lift",
      value: `#${args.supportiveTag.tag}`,
      detail: `${args.supportiveTag.count} better days`,
      tone: "cool",
    });
  }

  if (args.challengingTag) {
    cards.push({
      label: "Most friction",
      value: `#${args.challengingTag.tag}`,
      detail: `${args.challengingTag.count} harder days`,
      tone: "warm",
    });
  }

  if (args.bestWeekday) {
    cards.push({
      label: "Steadiest day",
      value: `${args.bestWeekday.label}s`,
      detail: `${args.bestWeekday.count} check-ins on that rhythm`,
      tone: "neutral",
    });
  }

  if (args.strongestCombo) {
    const [first, second] = args.strongestCombo.features.map(formatContextFeatureLabel);
    cards.push({
      label: "Strong combo",
      value: `${capitalize(first)} + ${second}`,
      detail: `${args.strongestCombo.count} repeated appearances`,
      tone: args.strongestCombo.tone === "challenging" ? "warm" : "cool",
    });
  } else if (args.topTag) {
    cards.push({
      label: "Most used tag",
      value: `#${args.topTag.tag}`,
      detail: `${args.topTag.count} total appearances`,
      tone: "neutral",
    });
  } else if (args.mostCommonMood.mood) {
    cards.push({
      label: "Most common mood",
      value: `${moodToEmoji[args.mostCommonMood.mood]} ${capitalize(args.mostCommonMood.mood)}`,
      detail: `${args.mostCommonMood.count} check-ins so far`,
      tone: "neutral",
    });
  }

  return cards.slice(0, 4);
}

function buildEvidenceCards(args: {
  supportiveTag?: TagAssociation;
  challengingTag?: TagAssociation;
}) {
  const cards: EvidenceCardData[] = [];

  if (args.supportiveTag) {
    cards.push({
      label: "Seems to help",
      title: `#${args.supportiveTag.tag} often showed up on better days.`,
      detail: `${args.supportiveTag.count} check-ins, about ${Math.abs(args.supportiveTag.deltaFromBaseline).toFixed(1)} points lighter than your usual baseline.`,
      tag: args.supportiveTag.tag,
      tone: "supportive",
    });
  }

  if (args.challengingTag) {
    cards.push({
      label: "Seems harder",
      title: `#${args.challengingTag.tag} often showed up on tougher days.`,
      detail: `${args.challengingTag.count} check-ins, about ${Math.abs(args.challengingTag.deltaFromBaseline).toFixed(1)} points heavier than your usual baseline.`,
      tag: args.challengingTag.tag,
      tone: "challenging",
    });
  }

  return cards;
}

function getSignalMeterValue(signal: ContextSignal | null) {
  if (signal?.delta == null) return 0.5;
  const normalized = (signal.delta + 2) / 4;
  return Math.max(0, Math.min(1, normalized));
}

function getSignalShiftLabel(signal: ContextSignal | null) {
  if (signal?.delta == null) return "early";
  if (signal.delta >= 0.6) return "stronger";
  if (signal.delta >= 0.25) return "better";
  if (signal.delta <= -0.6) return "harder";
  if (signal.delta <= -0.25) return "heavier";
  return "mixed";
}

function getSignalSummary(signal: ContextSignal | null, coverage: ContextCoverage) {
  if (signal?.delta == null) {
    if (coverage.thisWeekCount === 0) return "No check-ins for this signal yet this week.";
    if (!coverage.enoughThisWeek) return "A few more logs will make this pattern more trustworthy.";
    return "This is starting to form, but it is still early.";
  }

  if (signal.key === "stress") {
    return signal.delta <= -0.3
      ? "Higher-stress days trend worse than calmer days."
      : "Stress is showing a softer difference so far.";
  }

  if (signal.key === "sleep") {
    return signal.delta >= 0.3
      ? "Better-sleep days tend to land better."
      : "Sleep is showing only a light difference so far.";
  }

  return signal.delta >= 0.3
    ? "Higher-energy days usually feel better."
    : "Energy is showing only a light difference so far.";
}

function getContextDrilldownTarget(signal: ContextSignal | null): {
  key: MoodContextKey;
  band: "low" | "high";
} | null {
  if (!signal?.key || signal.delta == null) return null;

  if (signal.key === "stress") {
    return { key: "stress", band: signal.delta < 0 ? "high" : "low" };
  }

  return { key: signal.key, band: signal.delta >= 0 ? "high" : "low" };
}

export default function InsightsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compactCards = width >= 360;
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
  const monthComparison = useMemo(
    () => getMonthComparison(entries, thisMonth),
    [entries, thisMonth]
  );
  const contextSignals = useMemo(() => getContextSignals(entries), [entries]);
  const comboHighlights = useMemo(() => getComboHighlights(entries), [entries]);
  const sleepCoverage = useMemo(() => getContextCoverage(entries, "sleep", today), [entries, today]);
  const stressCoverage = useMemo(() => getContextCoverage(entries, "stress", today), [entries, today]);
  const energyCoverage = useMemo(() => getContextCoverage(entries, "energy", today), [entries, today]);

  const bestWeekday = weekdayInsights[0] ?? null;
  const strongestContext = contextSignals[0] ?? null;
  const strongestCombo = comboHighlights[0] ?? null;
  const sleepSignal = contextSignals.find((signal) => signal.key === "sleep") ?? null;
  const stressSignal = contextSignals.find((signal) => signal.key === "stress") ?? null;
  const energySignal = contextSignals.find((signal) => signal.key === "energy") ?? null;

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
  const monthStory = useMemo(
    () =>
      getMonthStory({
        monthCount,
        comparison: monthComparison,
        mostCommonMood,
      }),
    [monthCount, monthComparison, mostCommonMood]
  );

  const actionHint = useMemo(
    () =>
      getActionStory({
        challengingTag: challengingTags[0],
        supportiveTag: supportiveTags[0],
        strongestContext,
      }),
    [challengingTags, supportiveTags, strongestContext]
  );

  const patternCards = useMemo(
    () =>
      buildPatternCards({
        topTag: topTags[0],
        challengingTag: challengingTags[0],
        supportiveTag: supportiveTags[0],
        bestWeekday,
        strongestCombo,
        mostCommonMood,
      }),
    [topTags, challengingTags, supportiveTags, bestWeekday, strongestCombo, mostCommonMood]
  );
  const evidenceCards = useMemo(
    () =>
      buildEvidenceCards({
        supportiveTag: supportiveTags[0],
        challengingTag: challengingTags[0],
      }),
    [supportiveTags, challengingTags]
  );
  const sleepTarget = useMemo(() => getContextDrilldownTarget(sleepSignal), [sleepSignal]);
  const stressTarget = useMemo(() => getContextDrilldownTarget(stressSignal), [stressSignal]);
  const energyTarget = useMemo(() => getContextDrilldownTarget(energySignal), [energySignal]);

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Loading insights...</Text>
          <Text style={styles.stateText}>
            Turning your check-ins into a cleaner picture.
          </Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>No insights yet</Text>
          <Text style={styles.stateText}>
            Log a few moods first. Tags and context signals will make this page much more useful.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <SectionHeader
              title="Overview"
              subtitle="The main takeaway first, then the basics."
            />

            <HeroCard
              eyebrow="This week"
              title={weekStory.title}
              body={weekStory.body}
              action={actionHint}
              mood={mostCommonMood.mood}
            />

            <View style={styles.grid}>
              <StatCard
                label="This week"
                value={`${weekCount}`}
                note="days logged"
                compact={compactCards}
              />
              <StatCard
                label="This month"
                value={`${monthCount}`}
                note="days logged"
                compact={compactCards}
              />
              <StatCard
                label="Streak"
                value={`${currentStreak}`}
                note="current run"
                compact={compactCards}
              />
              <StatCard
                label="Best run"
                value={`${longestStreak}`}
                note="longest streak"
                compact={compactCards}
              />
            </View>

            <CompareCard
              eyebrow="Month to month"
              title={monthStory.title}
              body={monthStory.body}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Patterns"
              subtitle="A quick look at what keeps showing up."
            />

            {evidenceCards.length > 0 ? (
              <View style={styles.evidenceStack}>
                {evidenceCards.map((card) => (
                  <EvidenceCard
                    key={`${card.label}-${card.tag}`}
                    {...card}
                    onPress={() =>
                      router.push({
                        pathname: "/history",
                        params: { tag: card.tag },
                      })
                    }
                  />
                ))}
              </View>
            ) : null}

            <View style={styles.grid}>
              {patternCards.map((card) => (
                <PatternCard
                  key={`${card.label}-${card.value}`}
                  label={card.label}
                  value={card.value}
                  detail={card.detail}
                  tone={card.tone}
                  compact={compactCards}
                />
              ))}

              <WeekdayRhythmCard items={weekdayInsights} />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Context"
              subtitle="How sleep, stress, and energy seem to affect your days."
            />

            <View style={styles.signalGrid}>
              <SignalCard
                title="Sleep"
                signal={sleepSignal}
                coverage={sleepCoverage}
                onPress={
                  sleepTarget
                    ? () =>
                        router.push({
                          pathname: "/history",
                          params: {
                            contextKey: sleepTarget.key,
                            contextBand: sleepTarget.band,
                          },
                        })
                    : null
                }
              />
              <SignalCard
                title="Stress"
                signal={stressSignal}
                coverage={stressCoverage}
                onPress={
                  stressTarget
                    ? () =>
                        router.push({
                          pathname: "/history",
                          params: {
                            contextKey: stressTarget.key,
                            contextBand: stressTarget.band,
                          },
                        })
                    : null
                }
              />
              <SignalCard
                title="Energy"
                signal={energySignal}
                coverage={energyCoverage}
                onPress={
                  energyTarget
                    ? () =>
                        router.push({
                          pathname: "/history",
                          params: {
                            contextKey: energyTarget.key,
                            contextBand: energyTarget.band,
                          },
                        })
                    : null
                }
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Details"
              subtitle="Extra details if you want a closer look."
            />

            <MoodMixStripCard title="Mood mix this week" summary={weekSummary} />

            <View style={styles.grid}>
              <MoodMixCard
                title="This week"
                summary={weekSummary}
                compact={compactCards}
              />
              <MoodMixCard
                title="This month"
                summary={monthSummary}
                compact={compactCards}
              />
              <TagListCard
                title="Top tags"
                items={topTags}
                emptyLabel="Add tags to reveal your recurring contexts."
                compact={compactCards}
              />
              <TagListCard
                title="Harder-day tags"
                items={hardDayTags}
                emptyLabel="Tag lower-mood days to surface clearer tougher-day patterns."
                compact={compactCards}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 24,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.mutedText,
    lineHeight: 18,
  },
  heroCard: {
    backgroundColor: "#EEF4FF",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#D6E4FF",
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: "#8EB3FF",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 26,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  heroEyebrow: {
    ...typography.caption,
    color: "#4C6EA9",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    fontWeight: "700",
  },
  heroMoodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroMoodEmoji: {
    fontSize: 16,
  },
  heroMoodText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text,
    textTransform: "capitalize",
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    color: "#162033",
  },
  heroBody: {
    ...typography.body,
    color: "#52607A",
    lineHeight: 23,
  },
  heroActionPill: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    borderRadius: 999,
    backgroundColor: "#162033",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  compareCard: {
    width: "100%",
    backgroundColor: "#FFF8EC",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#F3D8AF",
    padding: spacing.md,
    gap: 6,
  },
  compareEyebrow: {
    ...typography.caption,
    color: "#9A5A23",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
  },
  compareTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: "#7C2D12",
  },
  compareBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "#8E5D2C",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  halfCard: {
    width: "48%",
  },
  fullCard: {
    width: "100%",
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E4E8F2",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    color: colors.text,
  },
  statNote: {
    fontSize: 13,
    color: "#667085",
  },
  patternCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E4E8F2",
    padding: spacing.md,
    gap: spacing.xs,
  },
  patternCardCool: {
    backgroundColor: "#F3F7FF",
    borderColor: "#D7E3FF",
  },
  patternCardWarm: {
    backgroundColor: "#FFF7ED",
    borderColor: "#F6D8AD",
  },
  patternLabel: {
    ...typography.caption,
    color: "#6A7283",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
  },
  patternValue: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: colors.text,
  },
  patternDetail: {
    fontSize: 13,
    lineHeight: 18,
    color: "#5F6B7A",
  },
  evidenceStack: {
    gap: spacing.sm,
  },
  evidenceCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  evidenceCardSupportive: {
    backgroundColor: "#F3FBF3",
    borderColor: "#CDE9C8",
  },
  evidenceCardChallenging: {
    backgroundColor: "#FFF7ED",
    borderColor: "#F6D8AD",
  },
  evidenceLabel: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
    color: "#5F6B7A",
  },
  evidenceTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: colors.text,
  },
  evidenceDetail: {
    fontSize: 14,
    lineHeight: 20,
    color: "#5F6B7A",
  },
  evidenceButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#162033",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  evidenceButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  signalGrid: {
    gap: spacing.sm,
  },
  signalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E4E8F2",
    padding: spacing.md,
    gap: spacing.sm,
  },
  signalCardPressable: {
    borderColor: "#D6E4FF",
  },
  signalTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  signalTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  signalShift: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#5F6B7A",
  },
  signalTrack: {
    position: "relative",
    height: 10,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    overflow: "visible",
  },
  signalTrackMid: {
    position: "absolute",
    left: "50%",
    marginLeft: -1,
    top: -3,
    bottom: -3,
    width: 2,
    borderRadius: 999,
    backgroundColor: "#C7D2FE",
  },
  signalThumb: {
    position: "absolute",
    top: -4,
    marginLeft: -8,
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  signalSummary: {
    fontSize: 14,
    lineHeight: 20,
    color: "#5F6B7A",
  },
  signalLinkPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signalLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  signalMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  signalMetaText: {
    fontSize: 12,
    color: "#7A8494",
  },
  stripCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E4E8F2",
    padding: spacing.md,
    gap: spacing.sm,
  },
  stripTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  mixStrip: {
    flexDirection: "row",
    height: 16,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#EEF2FF",
  },
  mixStripSegment: {
    height: "100%",
  },
  mixLegendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  mixLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mixLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  mixLegendText: {
    fontSize: 12,
    color: "#5F6B7A",
    fontWeight: "700",
  },
  weekdayChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
  },
  weekdayCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  weekdayCount: {
    fontSize: 10,
    color: "#7A8494",
    minHeight: 12,
  },
  weekdayTrack: {
    width: "100%",
    height: 78,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  weekdayBar: {
    width: "100%",
    borderRadius: 999,
  },
  weekdayLabel: {
    fontSize: 11,
    color: "#5F6B7A",
    fontWeight: "700",
  },
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E4E8F2",
    padding: spacing.md,
    gap: spacing.sm,
  },
  detailCardTitle: {
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
    width: 92,
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
    backgroundColor: "#F0F3FA",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
  },
  barValue: {
    width: 20,
    textAlign: "right",
    fontSize: 12,
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
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#D7E3FF",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  tagCount: {
    fontSize: 12,
    fontWeight: "800",
    color: "#5F6B7A",
  },
  emptyText: {
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
