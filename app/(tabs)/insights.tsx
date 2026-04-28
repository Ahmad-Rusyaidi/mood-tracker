import { useMoodEntries } from "@/hooks";
import { colors, spacing, typography } from "@/styles";
import type { Mood, MoodContextKey } from "@/types";
import {
  countLoggedDaysInMonth,
  countLoggedDaysInWeek,
  getComboHighlights,
  getContextCoverage,
  getContextSignals,
  getEntriesForMonth,
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
  confidence: string;
};

type SpotlightCardData = {
  label: string;
  title: string;
  detail: string;
  tone: "supportive" | "challenging" | "neutral";
  confidence?: string;
};

type GuidanceCardData = {
  eyebrow: string;
  title: string;
  body: string;
  prompt: string;
};

type HeroTone = "steady" | "lift" | "care";

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
  tone,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action?: string;
  mood?: Mood | null;
  tone: HeroTone;
}) {
  return (
    <View
      style={[
        styles.heroCard,
        tone === "lift" ? styles.heroCardLift : null,
        tone === "care" ? styles.heroCardCare : null,
      ]}
    >
      <View style={styles.heroTopRow}>
        <Text
          style={[
            styles.heroEyebrow,
            tone === "lift" ? styles.heroEyebrowLift : null,
            tone === "care" ? styles.heroEyebrowCare : null,
          ]}
        >
          {eyebrow}
        </Text>
        {mood ? (
          <View style={styles.heroMoodBadge}>
            <Text style={styles.heroMoodEmoji}>{moodToEmoji[mood]}</Text>
            <Text style={styles.heroMoodText}>{mood}</Text>
          </View>
        ) : null}
      </View>

      <Text
        style={[
          styles.heroTitle,
          tone === "lift" ? styles.heroTitleLift : null,
          tone === "care" ? styles.heroTitleCare : null,
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.heroBody,
          tone === "lift" ? styles.heroBodyLift : null,
          tone === "care" ? styles.heroBodyCare : null,
        ]}
      >
        {body}
      </Text>

      {action ? (
        <View
          style={[
            styles.heroActionPill,
            tone === "lift" ? styles.heroActionPillLift : null,
            tone === "care" ? styles.heroActionPillCare : null,
          ]}
        >
          <Text
            style={[
              styles.heroActionText,
              tone === "lift" ? styles.heroActionTextLift : null,
              tone === "care" ? styles.heroActionTextCare : null,
            ]}
          >
            {action}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function GuidanceCard({
  eyebrow,
  title,
  body,
  prompt,
}: GuidanceCardData) {
  return (
    <View style={styles.guidanceCard}>
      <Text style={styles.guidanceEyebrow}>{eyebrow}</Text>
      <Text style={styles.guidanceTitle}>{title}</Text>
      <Text style={styles.guidanceBody}>{body}</Text>
      <View style={styles.promptCard}>
        <Text style={styles.promptLabel}>Try this</Text>
        <Text style={styles.promptText}>{prompt}</Text>
      </View>
    </View>
  );
}

function CompareCard({
  eyebrow,
  title,
  body,
  confidence,
  onPress,
}: {
  eyebrow: string;
  title: string;
  body: string;
  confidence?: string;
  onPress?: (() => void) | null;
}) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress ?? undefined}
      style={[styles.compareCard, onPress ? styles.compareCardPressable : null]}
    >
      <Text style={styles.compareEyebrow}>{eyebrow}</Text>
      {confidence ? <Text style={styles.confidenceBadge}>{confidence}</Text> : null}
      <Text style={styles.compareTitle}>{title}</Text>
      <Text style={styles.compareBody}>{body}</Text>

      {onPress ? (
        <View style={styles.compareLinkPill}>
          <Text style={styles.compareLinkText}>View matching days</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function StatPill({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statPillLabel}>{label}</Text>
      <Text style={styles.statPillValue}>{value}</Text>
      {caption ? <Text style={styles.statPillNote}>{caption}</Text> : null}
    </View>
  );
}

function PatternCard({
  label,
  value,
  detail,
  tone,
  twoUp,
}: PatternCardData & { twoUp: boolean }) {
  return (
    <View
      style={[
        styles.patternCard,
        twoUp ? styles.halfCard : styles.fullCard,
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

function SpotlightCard({
  label,
  title,
  detail,
  tone,
  confidence,
  onPress,
  twoUp,
}: SpotlightCardData & { onPress?: (() => void) | null; twoUp: boolean }) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress ?? undefined}
      style={[
        styles.spotlightCard,
        twoUp ? styles.halfCard : styles.fullCard,
        tone === "supportive" ? styles.spotlightCardSupportive : null,
        tone === "challenging" ? styles.spotlightCardChallenging : null,
        tone === "neutral" ? styles.spotlightCardNeutral : null,
      ]}
    >
      <Text style={styles.spotlightLabel}>{label}</Text>
      {confidence ? <Text style={styles.confidenceBadge}>{confidence}</Text> : null}
      <Text style={styles.spotlightTitle}>{title}</Text>
      <Text style={styles.spotlightDetail}>{detail}</Text>
      {onPress ? <Text style={styles.spotlightLink}>Open days</Text> : null}
    </Pressable>
  );
}

function SignalCard({
  title,
  signal,
  coverage,
  confidence,
  onPress,
  cardWidth,
}: {
  title: string;
  signal: ContextSignal | null;
  coverage: ContextCoverage;
  confidence?: string;
  onPress?: (() => void) | null;
  cardWidth: number;
}) {
  const meterValue = getSignalMeterValue(signal);
  const verdictLabel = getSignalVerdictLabel(signal);
  const summary = getSignalSummary(signal, coverage);
  const confidenceLine = getSignalConfidenceLine(confidence, signal, coverage);

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress ?? undefined}
      style={[
        styles.signalCard,
        { width: cardWidth },
        onPress ? styles.signalCardPressable : null,
      ]}
    >
      <View style={styles.signalTopRow}>
        <Text style={styles.signalTitle}>{title}</Text>
        <Text style={styles.signalShift}>{verdictLabel}</Text>
      </View>

      {confidenceLine ? <Text style={styles.signalConfidence}>{confidenceLine}</Text> : null}

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

      <Text style={styles.signalMetaText}>
        {signal
          ? `${coverage.thisWeekCount} this week / ${signal.lowCount} low / ${signal.highCount} high`
          : `${coverage.thisWeekCount} this week`}
      </Text>

      <Text style={styles.signalSummary}>{summary}</Text>

      {onPress ? (
        <Text style={styles.signalLinkText}>Open days</Text>
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
  topTags,
  hardDayTags,
}: {
  topTags: { tag: string; count: number }[];
  hardDayTags: { tag: string; count: number }[];
}) {
  return (
    <View style={[styles.detailCard, styles.fullCard]}>
      <Text style={styles.detailCardTitle}>Tags that keep showing up</Text>

      <View style={styles.tagSection}>
        <Text style={styles.tagSectionLabel}>Most used</Text>
        {topTags.length === 0 ? (
          <Text style={styles.emptyText}>Add tags to reveal your recurring contexts.</Text>
        ) : (
          <View style={styles.tagWrap}>
            {topTags.map((item) => (
              <View key={`top-${item.tag}`} style={styles.tagPill}>
                <Text style={styles.tagText}>{`#${item.tag}`}</Text>
                <Text style={styles.tagCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.tagSection}>
        <Text style={styles.tagSectionLabel}>More common on tougher days</Text>
        {hardDayTags.length === 0 ? (
          <Text style={styles.emptyText}>Tag lower-mood days to reveal clearer tougher-day patterns.</Text>
        ) : (
          <View style={styles.tagWrap}>
            {hardDayTags.map((item) => (
              <View key={`hard-${item.tag}`} style={styles.tagPillWarm}>
                <Text style={styles.tagText}>{`#${item.tag}`}</Text>
                <Text style={styles.tagCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
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
  strongestContext?: ContextSignal | null;
  supportiveTag?: { tag: string; count: number };
  challengingTag?: { tag: string; count: number };
}) {
  const shift = formatScoreShift(args.comparison.delta);

  if (args.weekCount < 3) {
    return {
      eyebrow: "Settling in",
      tone: "steady" as HeroTone,
      title: "This week is still taking shape.",
      body:
        args.currentStreak > 0
          ? `${args.weekCount} check-ins so far, with a ${args.currentStreak}-day streak still going.`
          : `${args.weekCount} check-ins so far. A few more will sharpen the picture.`,
    };
  }

  if (shift && args.comparison.previousCount >= 3) {
    if (args.comparison.delta != null && args.comparison.delta <= -0.35) {
      return {
        eyebrow: "Go gently",
        tone: "care" as HeroTone,
        title: `This week feels ${shift} than last week.`,
        body:
          args.challengingTag != null
            ? `That does not mean you are going backward. It may just be a week that needs softer handling, especially around #${args.challengingTag.tag}.`
            : "That does not mean you are going backward. It may just be a week that needs softer handling.",
      };
    }

    if (args.comparison.delta != null && args.comparison.delta >= 0.35) {
      return {
        eyebrow: "A small lift",
        tone: "lift" as HeroTone,
        title: `This week feels ${shift} than last week.`,
        body:
          args.supportiveTag != null
            ? `Something may be helping, and #${args.supportiveTag.tag} keeps showing up as part of that steadier rhythm.`
            : "Something may be helping, even if the week still feels ordinary from the inside.",
      };
    }

    return {
      eyebrow: "Steady view",
      tone: "steady" as HeroTone,
      title: `This week feels ${shift} than last week.`,
      body:
        args.mostCommonMood.mood != null
          ? `${capitalize(args.mostCommonMood.mood)} has been your most common mood overall.`
          : "You now have enough check-ins to compare this week with last week.",
    };
  }

  if (args.currentStreak >= 7) {
    return {
      eyebrow: "You kept showing up",
      tone: "lift" as HeroTone,
      title: "Your consistency is starting to matter.",
      body: `${args.currentStreak} days in a row gives this page a much clearer signal, and it says something kind about your effort too.`,
    };
  }

  if (args.strongestContext?.key === "stress" && (args.strongestContext.delta ?? 0) <= -0.3) {
    return {
      eyebrow: "Take care",
      tone: "care" as HeroTone,
      title: "Stress looks heavier than usual.",
      body: "The signal is not a verdict about you. It is just a nudge that this may be a week for simpler expectations and more recovery.",
    };
  }

  return {
    eyebrow: "Building a baseline",
    tone: "steady" as HeroTone,
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

function getGuidanceCard(args: {
  weekCount: number;
  currentStreak: number;
  supportiveTag?: { tag: string; count: number };
  challengingTag?: { tag: string; count: number };
  strongestContext?: ContextSignal | null;
  bestWeekday?: { label: string; count: number } | null;
}): GuidanceCardData {
  if (args.challengingTag && args.supportiveTag) {
    return {
      eyebrow: "What this might mean",
      title: `Some days may need a softer plan.`,
      body: `#${args.challengingTag.tag} keeps showing up on harder days, while #${args.supportiveTag.tag} seems to help. You do not need to fix everything, just protect the heavier days a little more.`,
      prompt: `On the next #${args.challengingTag.tag} day, make room for one small #${args.supportiveTag.tag} moment.`,
    };
  }

  if (args.strongestContext?.key === "stress" && (args.strongestContext.delta ?? 0) <= -0.3) {
    return {
      eyebrow: "What this might mean",
      title: "Your harder days may be arriving overloaded.",
      body: "Stress looks like the clearest drag right now. That does not mean the week is failing, only that your system may need more recovery before the pressure peaks.",
      prompt: "Pick one small reset before your busiest part of the day.",
    };
  }

  if (args.strongestContext?.key === "sleep" && (args.strongestContext.delta ?? 0) >= 0.3) {
    return {
      eyebrow: "What this might mean",
      title: "Sleep may be one of your quiet supports.",
      body: "The lighter days are lining up with better sleep. That is useful because it gives you something steady to protect when life gets noisy.",
      prompt: "Treat sleep like support, not a bonus, for the next few days.",
    };
  }

  if (args.currentStreak >= 7) {
    return {
      eyebrow: "What this might mean",
      title: "You have been showing up consistently.",
      body: `A ${args.currentStreak}-day streak gives this page more signal, and it also says something kind about your effort. You are paying attention, even when the week is ordinary.`,
      prompt: "Look for one small thing that made the steadier days easier to carry.",
    };
  }

  if (args.bestWeekday) {
    return {
      eyebrow: "What this might mean",
      title: `${args.bestWeekday.label} may be part of your steadier rhythm.`,
      body: "One day of the week is already feeling a little easier than the others. That can be a clue about pace, routine, or what you ask from yourself on that day.",
      prompt: `What felt different about your recent ${args.bestWeekday.label}s?`,
    };
  }

  return {
    eyebrow: "What this might mean",
    title: "The picture is still forming, and that is okay.",
    body: `You already have ${args.weekCount} check-ins this week. Even before the patterns feel strong, the habit of noticing is valuable on its own.`,
    prompt: "Ask yourself what felt a little lighter than expected this week.",
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
      detail: `${args.bestWeekday.count} check-ins`,
      tone: "neutral",
    });
  }

  if (args.strongestCombo) {
    const [first, second] = args.strongestCombo.features.map(formatContextFeatureLabel);
    cards.push({
      label: "Strong combo",
      value: `${capitalize(first)} + ${second}`,
      detail: `${args.strongestCombo.count} repeated times`,
      tone: args.strongestCombo.tone === "challenging" ? "warm" : "cool",
    });
  } else if (args.topTag) {
    cards.push({
      label: "Most used tag",
      value: `#${args.topTag.tag}`,
      detail: `${args.topTag.count} times`,
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
      label: "Seems to help this month",
      title: `#${args.supportiveTag.tag} lined up with better days.`,
      detail: `${args.supportiveTag.count} check-ins, ${Math.abs(args.supportiveTag.deltaFromBaseline).toFixed(1)} points lighter than usual.`,
      tag: args.supportiveTag.tag,
      tone: "supportive",
      confidence: getConfidenceLabel(args.supportiveTag.count),
    });
  }

  if (args.challengingTag) {
    cards.push({
      label: "Seems harder this month",
      title: `#${args.challengingTag.tag} lined up with tougher days.`,
      detail: `${args.challengingTag.count} check-ins, ${Math.abs(args.challengingTag.deltaFromBaseline).toFixed(1)} points heavier than usual.`,
      tag: args.challengingTag.tag,
      tone: "challenging",
      confidence: getConfidenceLabel(args.challengingTag.count),
    });
  }

  return cards;
}

function getContextSpotlight(signal: ContextSignal | null): SpotlightCardData | null {
  if (!signal || signal.delta == null) return null;

  if (signal.key === "stress") {
    return {
      label: "Watch this",
      title: signal.delta <= -0.3 ? "High-stress days land harder." : "Calmer days look a bit lighter.",
      detail:
        signal.delta <= -0.3
          ? `${signal.highCount} higher-stress days stood out more than calmer ones.`
          : `${signal.lowCount} calmer days look a bit gentler so far.`,
      tone: signal.delta <= -0.3 ? "challenging" : "neutral",
      confidence: getSignalConfidenceLabel(signal),
    };
  }

  if (signal.key === "sleep") {
    return {
      label: "Watch this",
      title: signal.delta >= 0.3 ? "Better sleep seems to help." : "Sleep is mixed so far.",
      detail:
        signal.delta >= 0.3
          ? `${signal.highCount} better-sleep days felt lighter than low-sleep ones.`
          : "There is a signal here, but it is still early.",
      tone: signal.delta >= 0.3 ? "supportive" : "neutral",
      confidence: getSignalConfidenceLabel(signal),
    };
  }

  return {
    label: "Watch this",
    title: signal.delta >= 0.3 ? "Higher energy usually helps." : "Energy is mixed so far.",
    detail:
      signal.delta >= 0.3
        ? `${signal.highCount} higher-energy days were usually lighter than low-energy ones.`
        : "Energy is only showing a light difference right now.",
    tone: signal.delta >= 0.3 ? "supportive" : "neutral",
    confidence: getSignalConfidenceLabel(signal),
  };
}

function getConfidenceLabel(sampleCount: number) {
  if (sampleCount >= 6) return "steadier pattern";
  if (sampleCount >= 4) return "growing pattern";
  return "early signal";
}

function getSignalMeterValue(signal: ContextSignal | null) {
  if (signal?.delta == null) return 0.5;
  const normalized = (signal.delta + 2) / 4;
  return Math.max(0, Math.min(1, normalized));
}

function getSignalVerdictLabel(signal: ContextSignal | null) {
  if (signal?.delta == null) return "early";

  if (signal.key === "stress") {
    return signal.delta <= -0.3 ? "watch" : "mixed";
  }

  if (signal.key === "sleep") {
    return signal.delta >= 0.3 ? "helpful" : "mixed";
  }

  return signal.delta >= 0.3 ? "helpful" : "mixed";
}

function getSignalSummary(signal: ContextSignal | null, coverage: ContextCoverage) {
  if (signal?.delta == null) {
    if (coverage.thisWeekCount === 0) return "No check-ins for this signal yet this week.";
    if (!coverage.enoughThisWeek) return "A few more logs will make this clearer.";
    return "This is starting to form, but it is still early.";
  }

  if (signal.key === "stress") {
    return signal.delta <= -0.3
      ? "Higher-stress days tend to land worse."
      : "Stress is showing only a light difference so far.";
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

function getSignalConfidenceLine(
  confidence: string | undefined,
  signal: ContextSignal | null,
  coverage: ContextCoverage
) {
  if (!confidence) return null;
  if (!signal) return confidence;
  return `${confidence} / ${coverage.totalCount} total`;
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

function getSignalConfidenceLabel(signal: ContextSignal | null) {
  if (!signal) return "early signal";
  return getConfidenceLabel(Math.max(signal.lowCount, signal.highCount));
}

function getComparisonConfidenceLabel(currentCount: number, previousCount: number) {
  return getConfidenceLabel(Math.min(currentCount, previousCount));
}

export default function InsightsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const twoUpPatterns = width >= 430;
  const twoUpSpotlights = width >= 440;
  const twoUpDetails = width >= 430;
  const signalCardWidth = Math.min(Math.max(width - 56, 260), 312);
  const today = useMemo(() => new Date(), []);
  const thisMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today]
  );
  const currentMonthKey = useMemo(
    () => `${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, "0")}`,
    [thisMonth]
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
  const currentMonthEntries = useMemo(
    () => getEntriesForMonth(entries, thisMonth),
    [entries, thisMonth]
  );
  const topTags = useMemo(() => getTopTags(entries), [entries]);
  const hardDayTags = useMemo(
    () => getTopTagsForMoods(entries, ["sad", "anxious", "angry"]),
    [entries]
  );
  const supportiveTags = useMemo(() => getTopSupportiveTags(entries), [entries]);
  const challengingTags = useMemo(() => getTopChallengingTags(entries), [entries]);
  const monthSupportiveTags = useMemo(
    () => getTopSupportiveTags(currentMonthEntries),
    [currentMonthEntries]
  );
  const monthChallengingTags = useMemo(
    () => getTopChallengingTags(currentMonthEntries),
    [currentMonthEntries]
  );
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
        strongestContext,
        supportiveTag: supportiveTags[0],
        challengingTag: challengingTags[0],
      }),
    [weekCount, currentStreak, comparison, mostCommonMood, strongestContext, supportiveTags, challengingTags]
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
        supportiveTag: monthSupportiveTags[0],
        challengingTag: monthChallengingTags[0],
      }),
    [monthSupportiveTags, monthChallengingTags]
  );
  const contextSpotlight = useMemo(
    () => getContextSpotlight(strongestContext),
    [strongestContext]
  );
  const guidanceCard = useMemo(
    () =>
      getGuidanceCard({
        weekCount,
        currentStreak,
        supportiveTag: supportiveTags[0],
        challengingTag: challengingTags[0],
        strongestContext,
        bestWeekday,
      }),
    [weekCount, currentStreak, supportiveTags, challengingTags, strongestContext, bestWeekday]
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
            <SectionHeader title="This week" />

            <HeroCard
              eyebrow={weekStory.eyebrow}
              title={weekStory.title}
              body={weekStory.body}
              action={actionHint}
              mood={mostCommonMood.mood}
              tone={weekStory.tone}
            />

            <GuidanceCard {...guidanceCard} />

            <View style={styles.statsPanel}>
              <StatPill
                label="This week"
                value={`${weekCount}`}
                caption="days logged"
              />
              <StatPill
                label="This month"
                value={`${monthCount}`}
                caption="days logged"
              />
              <StatPill
                label="Streak"
                value={`${currentStreak}`}
                caption="current run"
              />
              <StatPill
                label="Best run"
                value={`${longestStreak}`}
                caption="longest streak"
              />
            </View>

            <CompareCard
              eyebrow="Month to month"
              title={monthStory.title}
              body={monthStory.body}
              confidence={getComparisonConfidenceLabel(monthComparison.currentCount, monthComparison.previousCount)}
              onPress={() =>
                router.push({
                  pathname: "/history",
                  params: { month: currentMonthKey },
                })
              }
            />
          </View>

          <View style={styles.section}>
            <SectionHeader title="What stands out" />

            <View style={styles.grid}>
              {evidenceCards.map((card) => (
                <SpotlightCard
                  key={`${card.label}-${card.tag}`}
                  label={card.label}
                  title={card.title}
                  detail={card.detail}
                  tone={card.tone}
                  confidence={card.confidence}
                  twoUp={twoUpSpotlights}
                  onPress={() =>
                    router.push({
                      pathname: "/history",
                      params: { tag: card.tag, month: currentMonthKey },
                    })
                  }
                />
              ))}
              {contextSpotlight ? (
                <SpotlightCard
                  {...contextSpotlight}
                  twoUp={twoUpSpotlights}
                  onPress={
                    strongestContext
                      ? () => {
                          const target = getContextDrilldownTarget(strongestContext);
                          if (!target) return;
                          router.push({
                            pathname: "/history",
                            params: {
                              contextKey: target.key,
                              contextBand: target.band,
                            },
                          });
                        }
                      : null
                  }
                />
              ) : null}
            </View>

            <View style={styles.grid}>
              {patternCards.map((card) => (
                <PatternCard
                  key={`${card.label}-${card.value}`}
                  label={card.label}
                  value={card.value}
                  detail={card.detail}
                  tone={card.tone}
                  twoUp={twoUpPatterns}
                />
              ))}
            </View>

            <WeekdayRhythmCard items={weekdayInsights} />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.signalRail}
              decelerationRate="fast"
              snapToInterval={signalCardWidth + spacing.sm}
              snapToAlignment="start"
            >
              <SignalCard
                title="Sleep"
                signal={sleepSignal}
                coverage={sleepCoverage}
                confidence={getSignalConfidenceLabel(sleepSignal)}
                cardWidth={signalCardWidth}
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
                confidence={getSignalConfidenceLabel(stressSignal)}
                cardWidth={signalCardWidth}
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
                confidence={getSignalConfidenceLabel(energySignal)}
                cardWidth={signalCardWidth}
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
            </ScrollView>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Breakdown" />

            <MoodMixStripCard title="Mood mix this week" summary={weekSummary} />

            <View style={styles.grid}>
              <MoodMixCard
                title="This month"
                summary={monthSummary}
                compact={twoUpDetails}
              />
              <TagListCard topTags={topTags} hardDayTags={hardDayTags} />
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
    gap: spacing.lg,
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
    lineHeight: 17,
  },
  heroCard: {
    backgroundColor: "#EAF1FF",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#D2E2FF",
    padding: spacing.lg,
    gap: spacing.xs,
    shadowColor: "#8EB3FF",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 22,
    elevation: 4,
  },
  heroCardLift: {
    backgroundColor: "#EEF9F1",
    borderColor: "#CFE7D4",
    shadowColor: "#7BC18E",
  },
  heroCardCare: {
    backgroundColor: "#FFF4EA",
    borderColor: "#F3D4B7",
    shadowColor: "#E7A56C",
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
  heroEyebrowLift: {
    color: "#2F7A47",
  },
  heroEyebrowCare: {
    color: "#A35A1F",
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
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: "#162033",
  },
  heroTitleLift: {
    color: "#163321",
  },
  heroTitleCare: {
    color: "#5A2C13",
  },
  heroBody: {
    ...typography.body,
    color: "#52607A",
    lineHeight: 21,
  },
  heroBodyLift: {
    color: "#446152",
  },
  heroBodyCare: {
    color: "#805333",
  },
  heroActionPill: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    borderRadius: 999,
    backgroundColor: "#162033",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  heroActionPillLift: {
    backgroundColor: "#1F5F35",
  },
  heroActionPillCare: {
    backgroundColor: "#6E3A17",
  },
  heroActionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  heroActionTextLift: {
    color: "#F7FFF8",
  },
  heroActionTextCare: {
    color: "#FFF7F0",
  },
  guidanceCard: {
    backgroundColor: "#FFF9EE",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F3DEC0",
    padding: spacing.md,
    gap: 8,
  },
  guidanceEyebrow: {
    ...typography.caption,
    color: "#9A5A23",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  guidanceTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "800",
    color: "#7C2D12",
  },
  guidanceBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "#8E5D2C",
  },
  promptCard: {
    marginTop: 4,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 3,
  },
  promptLabel: {
    ...typography.caption,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.45,
    fontWeight: "700",
  },
  promptText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
    fontWeight: "700",
  },
  statsPanel: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statPill: {
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E4E8F2",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 2,
  },
  statPillLabel: {
    ...typography.caption,
    color: colors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  statPillValue: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
    color: colors.text,
  },
  statPillNote: {
    fontSize: 12,
    color: "#667085",
  },
  compareCard: {
    width: "100%",
    backgroundColor: "#FFF6E7",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F3D8AF",
    padding: spacing.md,
    gap: 5,
  },
  compareCardPressable: {
    borderColor: "#EBCB96",
  },
  compareEyebrow: {
    ...typography.caption,
    color: "#9A5A23",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
  },
  compareTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "800",
    color: "#7C2D12",
  },
  compareBody: {
    fontSize: 13,
    lineHeight: 19,
    color: "#8E5D2C",
  },
  compareLinkPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.78)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  compareLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9A3412",
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
  spotlightCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 6,
  },
  spotlightCardSupportive: {
    backgroundColor: "#F2FAF3",
    borderColor: "#CDE9C8",
  },
  spotlightCardChallenging: {
    backgroundColor: "#FFF5EA",
    borderColor: "#F3D0A6",
  },
  spotlightCardNeutral: {
    backgroundColor: "#F7F8FC",
    borderColor: "#E4E8F2",
  },
  spotlightLabel: {
    ...typography.caption,
    color: "#5F6B7A",
    textTransform: "uppercase",
    letterSpacing: 0.45,
    fontWeight: "700",
  },
  spotlightTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "800",
    color: colors.text,
  },
  spotlightDetail: {
    fontSize: 12,
    lineHeight: 17,
    color: "#5F6B7A",
  },
  spotlightLink: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  patternCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E4E8F2",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 4,
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
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "800",
    color: colors.text,
  },
  patternDetail: {
    fontSize: 12,
    lineHeight: 16,
    color: "#5F6B7A",
  },
  confidenceBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.78)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: "#5F6B7A",
  },
  signalRail: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  signalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E4E8F2",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
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
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#5F6B7A",
  },
  signalConfidence: {
    fontSize: 11,
    color: "#7A8494",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.25,
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
    fontSize: 13,
    lineHeight: 18,
    color: "#5F6B7A",
  },
  signalLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  signalMetaText: {
    fontSize: 12,
    color: "#7A8494",
  },
  stripCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E4E8F2",
    padding: spacing.md,
    gap: spacing.xs,
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
    height: 72,
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
    borderRadius: 20,
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
  tagSection: {
    gap: spacing.sm,
  },
  tagSectionLabel: {
    ...typography.caption,
    color: "#6A7283",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
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
  tagPillWarm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#FFF4E7",
    borderWidth: 1,
    borderColor: "#F3D0A6",
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

