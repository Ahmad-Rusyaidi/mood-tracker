import type { Mood, MoodContextKey } from "@/types";
import type {
  ComboHighlight,
  ContextCoverage,
  ContextSignal,
  MoodSummary,
  TagAssociation,
  WeekWarning,
} from "@/utils/moodStats";
import { moodToEmoji } from "@/utils/moodUi";

export const MOOD_ORDER: Mood[] = ["happy", "neutral", "sad", "anxious", "angry"];
export const WEEKDAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const MOOD_BAR_COLORS: Record<Mood, string> = {
  happy: "#F8C858",
  neutral: "#72C18C",
  sad: "#7FB5FF",
  anxious: "#B297F4",
  angry: "#F28B82",
};

export type HeroTone = "steady" | "lift" | "care";

export type PatternCardData = {
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "cool" | "warm";
};

export type EvidenceCardData = {
  label: string;
  title: string;
  detail: string;
  tag: string;
  tone: "supportive" | "challenging";
  confidence: string;
};

export type SpotlightCardData = {
  label: string;
  title: string;
  detail: string;
  tone: "supportive" | "challenging" | "neutral";
  confidence?: string;
};

export type GuidanceCardData = {
  eyebrow: string;
  title: string;
  body: string;
  prompt: string;
};

export type HeroCardData = {
  eyebrow: string;
  title: string;
  body: string;
  tone: HeroTone;
};

export type ContextDrilldownTarget = {
  key: MoodContextKey;
  band: "low" | "high";
};

type CountedTag = {
  tag: string;
  count: number;
};

type CommonMood = {
  mood: Mood | null;
  count: number;
};

type BestWeekday = {
  label: string;
  count: number;
} | null;

type ScoreComparison = {
  delta: number | null;
  previousCount: number;
};

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatRangeLabel(rangeLabel: string) {
  return rangeLabel.toLowerCase();
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

export function getMoodMixSummary(summary: MoodSummary, rangeLabel: string) {
  const entries = Object.entries(summary) as [Mood, number][];
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) {
    return `No mood mix yet for ${formatRangeLabel(rangeLabel)}.`;
  }

  const ordered = [...entries]
    .filter(([, count]) => count > 0)
    .sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0])));

  const [topMood, topCount] = ordered[0];
  const topShare = topCount / total;
  const topLabel = `${moodToEmoji[topMood]} ${topMood}`;

  if (topShare >= 0.6) {
    return `${capitalize(topLabel)} shaped most of ${formatRangeLabel(rangeLabel)}.`;
  }

  const second = ordered[1];
  if (second && (topCount + second[1]) / total >= 0.75) {
    return `${capitalize(topLabel)} and ${second[0]} made up most of ${formatRangeLabel(
      rangeLabel
    )}.`;
  }

  return `${total} check-ins made ${formatRangeLabel(rangeLabel)} feel fairly mixed overall.`;
}

export function getWeekdayRhythmSummary(
  items: { label: string; count: number; averageScore: number }[]
) {
  if (items.length === 0) {
    return "Log a few more weekdays to reveal your steadier days.";
  }

  const best = items[0];
  const toughest = items[items.length - 1];

  if (!best) {
    return "Log a few more weekdays to reveal your steadier days.";
  }

  if (items.length === 1 || best.label === toughest?.label) {
    return `${best.label} is starting to form a pattern, but it is still early.`;
  }

  return `${best.label} looks steadiest so far, while ${toughest?.label} tends to feel heavier.`;
}

export function getWeekStory(args: {
  weekCount: number;
  currentStreak: number;
  comparison: ScoreComparison;
  mostCommonMood: CommonMood;
  strongestContext?: ContextSignal | null;
  supportiveTag?: CountedTag;
  challengingTag?: CountedTag;
}): HeroCardData {
  const shift = formatScoreShift(args.comparison.delta);

  if (args.weekCount < 3) {
    return {
      eyebrow: "Settling in",
      tone: "steady",
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
        tone: "care",
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
        tone: "lift",
        title: `This week feels ${shift} than last week.`,
        body:
          args.supportiveTag != null
            ? `Something may be helping, and #${args.supportiveTag.tag} keeps showing up as part of that steadier rhythm.`
            : "Something may be helping, even if the week still feels ordinary from the inside.",
      };
    }

    return {
      eyebrow: "Steady view",
      tone: "steady",
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
      tone: "lift",
      title: "Your consistency is starting to matter.",
      body: `${args.currentStreak} days in a row gives this page a much clearer signal, and it says something kind about your effort too.`,
    };
  }

  if (args.strongestContext?.key === "stress" && (args.strongestContext.delta ?? 0) <= -0.3) {
    return {
      eyebrow: "Take care",
      tone: "care",
      title: "Stress looks heavier than usual.",
      body: "The signal is not a verdict about you. It is just a nudge that this may be a week for simpler expectations and more recovery.",
    };
  }

  return {
    eyebrow: "Building a baseline",
    tone: "steady",
    title: "You are building a useful weekly baseline.",
    body:
      args.currentStreak >= 3
        ? `${args.weekCount} check-ins this week, and your streak is still intact.`
        : `${args.weekCount} check-ins this week is enough to start spotting early patterns.`,
  };
}

export function getActionStory(args: {
  challengingTag?: CountedTag;
  supportiveTag?: CountedTag;
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

export function getMonthStory(args: {
  monthCount: number;
  comparison: ScoreComparison;
  mostCommonMood: CommonMood;
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

export function getGuidanceCard(args: {
  weekCount: number;
  currentStreak: number;
  supportiveTag?: CountedTag;
  challengingTag?: CountedTag;
  strongestContext?: ContextSignal | null;
  bestWeekday?: BestWeekday;
}): GuidanceCardData {
  if (args.challengingTag && args.supportiveTag) {
    return {
      eyebrow: "What this might mean",
      title: "Some days may need a softer plan.",
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

export function buildPatternCards(args: {
  topTag?: CountedTag;
  challengingTag?: CountedTag;
  supportiveTag?: CountedTag;
  bestWeekday?: BestWeekday;
  strongestCombo?: ComboHighlight | null;
  mostCommonMood: CommonMood;
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

export function buildEvidenceCards(args: {
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

export function getContextSpotlight(signal: ContextSignal | null): SpotlightCardData | null {
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

export function getConfidenceLabel(sampleCount: number) {
  if (sampleCount >= 6) return "steadier pattern";
  if (sampleCount >= 4) return "growing pattern";
  return "early signal";
}

export function getSignalMeterValue(signal: ContextSignal | null) {
  if (signal?.delta == null) return 0.5;
  const normalized = (signal.delta + 2) / 4;
  return Math.max(0, Math.min(1, normalized));
}

export function getSignalVerdictLabel(signal: ContextSignal | null) {
  if (signal?.delta == null) return "early";

  if (signal.key === "stress") {
    if (signal.delta <= -0.8) return "strong drag";
    if (signal.delta <= -0.3) return "watch";
    return "mixed";
  }

  if (signal.key === "sleep") {
    if (signal.delta >= 0.8) return "strong lift";
    if (signal.delta >= 0.3) return "helpful";
    return "mixed";
  }

  if (signal.delta >= 0.8) return "strong lift";
  if (signal.delta >= 0.3) return "helpful";
  return "mixed";
}

export function getSignalSummary(signal: ContextSignal | null, coverage: ContextCoverage) {
  if (signal?.delta == null) {
    if (coverage.thisWeekCount === 0) return "No check-ins for this signal yet this week.";
    if (!coverage.enoughThisWeek) return "A few more logs will make this clearer.";
    return "This is starting to form, but it is still early.";
  }

  if (signal.key === "stress") {
    if (signal.delta <= -0.8) {
      return "Stress has the clearest downside right now, with a noticeable drop on high-stress days.";
    }

    return signal.delta <= -0.3
      ? "Higher-stress days tend to land worse."
      : "Stress is showing only a light difference so far.";
  }

  if (signal.key === "sleep") {
    if (signal.delta >= 0.8) {
      return "Sleep looks like a strong support right now, with better days clustering around better rest.";
    }

    return signal.delta >= 0.3
      ? "Better-sleep days tend to land better."
      : "Sleep is showing only a light difference so far.";
  }

  if (signal.delta >= 0.8) {
    return "Energy looks like a real lever right now, with a noticeable lift on higher-energy days.";
  }

  return signal.delta >= 0.3
    ? "Higher-energy days usually feel better."
    : "Energy is showing only a light difference so far.";
}

export function getSignalConfidenceLine(
  confidence: string | undefined,
  signal: ContextSignal | null,
  coverage: ContextCoverage
) {
  if (!confidence) return null;
  if (!signal) return confidence;
  return `${confidence} / ${coverage.totalCount} total`;
}

export function getContextDrilldownTarget(
  signal: ContextSignal | null
): ContextDrilldownTarget | null {
  if (!signal?.key || signal.delta == null) return null;

  if (signal.key === "stress") {
    return { key: "stress", band: signal.delta < 0 ? "high" : "low" };
  }

  return { key: signal.key, band: signal.delta >= 0 ? "high" : "low" };
}

export function getSignalConfidenceLabel(signal: ContextSignal | null) {
  if (!signal) return "early signal";
  return getConfidenceLabel(Math.max(signal.lowCount, signal.highCount));
}

export function getComparisonConfidenceLabel(currentCount: number, previousCount: number) {
  return getConfidenceLabel(Math.min(currentCount, previousCount));
}

export function getSignalDeltaText(signal: ContextSignal | null) {
  if (signal?.delta == null) return "Not enough contrast yet";
  return `${Math.abs(signal.delta).toFixed(1)} point swing`;
}

export function getWarningTone(warning: WeekWarning) {
  if (warning.id === "hard-streak" || warning.id === "stress-warning") {
    return "warm" as const;
  }

  return "cool" as const;
}

export function getWarningLabel(warning: WeekWarning) {
  if (warning.id === "weekly-drop") return "Week shift";
  if (warning.id === "hard-streak") return "Hard run";
  if (warning.id === "stress-warning") return "Stress watch";
  if (warning.id === "sleep-warning") return "Sleep watch";
  return "Watch this";
}
