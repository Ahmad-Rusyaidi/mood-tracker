import type { Mood, MoodContextKey, MoodEntry } from "@/types";
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

const ANALYSIS_MOOD_SCORE: Record<Mood, number> = {
  happy: 5,
  neutral: 3,
  sad: 2,
  anxious: 1,
  angry: 0,
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

export type AnalysisProfileData = {
  eyebrow: string;
  title: string;
  body: string;
  evidence: string;
  tone: HeroTone;
};

export type AnalysisLensData = {
  label: string;
  title: string;
  detail: string;
  tone: "supportive" | "challenging" | "neutral";
};

export type ExperimentCardData = {
  label: string;
  title: string;
  detail: string;
};

export type NarrativeSummaryData = {
  eyebrow: string;
  summary: string;
  focus: string;
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

function parseISODateLocal(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

function isHardMood(mood: Mood) {
  return mood === "sad" || mood === "anxious" || mood === "angry";
}

function isSteadyMood(mood: Mood) {
  return mood === "happy" || mood === "neutral";
}

function average(numbers: number[]) {
  if (numbers.length === 0) return null;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}

function describeDominantMood(mood: Mood) {
  if (mood === "happy") return "lighter";
  if (mood === "neutral") return "steadier";
  if (mood === "sad") return "heavier";
  if (mood === "anxious") return "more tense";
  return "more reactive";
}

function describeContextLevel(key: MoodContextKey, band: "low" | "high") {
  if (key === "stress") {
    return band === "high" ? "higher stress" : "lower stress";
  }

  if (key === "sleep") {
    return band === "high" ? "better sleep" : "lower sleep";
  }

  return band === "high" ? "higher energy" : "lower energy";
}

function getContextBand(signal: ContextSignal) {
  if (signal.key === "stress") {
    return signal.delta != null && signal.delta < 0 ? "high" : "low";
  }

  return signal.delta != null && signal.delta >= 0 ? "high" : "low";
}

function summarizeMoodBalance(summary: MoodSummary) {
  const total = Object.values(summary).reduce((sum, count) => sum + count, 0);
  const hardCount = summary.sad + summary.anxious + summary.angry;
  const steadyCount = summary.happy + summary.neutral;
  const ordered = (Object.entries(summary) as [Mood, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0])));
  const dominantMood = ordered[0]?.[0] ?? null;
  const dominantCount = ordered[0]?.[1] ?? 0;

  return {
    total,
    hardCount,
    steadyCount,
    hardShare: total === 0 ? 0 : hardCount / total,
    steadyShare: total === 0 ? 0 : steadyCount / total,
    dominantMood,
    dominantShare: total === 0 ? 0 : dominantCount / total,
  };
}

function buildEvidenceLine(totalCheckIns: number, taggedCount: number, contextualCount: number) {
  const parts = [`${totalCheckIns} check-ins`];

  if (taggedCount > 0) {
    parts.push(`${taggedCount} tagged days`);
  }

  if (contextualCount > 0) {
    parts.push(`${contextualCount} context-rich days`);
  }

  return `Based on ${parts.join(", ")}.`;
}

function getSupportExperimentTitle(
  supportiveTag: CountedTag | undefined,
  helpfulSignal: ContextSignal | null,
  bestWeekday?: BestWeekday
) {
  if (supportiveTag && helpfulSignal) {
    return `Pair #${supportiveTag.tag} with ${describeContextLevel(
      helpfulSignal.key,
      getContextBand(helpfulSignal)
    )}.`;
  }

  if (supportiveTag) {
    return `Deliberately repeat #${supportiveTag.tag} on one ordinary day.`;
  }

  if (helpfulSignal) {
    return `Protect ${describeContextLevel(helpfulSignal.key, getContextBand(helpfulSignal))}.`;
  }

  if (bestWeekday) {
    return `Borrow the shape of your recent ${bestWeekday.label}.`;
  }

  return "Repeat one condition that made a recent day easier.";
}

function getSupportExperimentDetail(
  supportiveTag: CountedTag | undefined,
  helpfulSignal: ContextSignal | null,
  bestWeekday?: BestWeekday
) {
  if (supportiveTag && helpfulSignal) {
    return `Your lighter days often include #${supportiveTag.tag} and ${describeContextLevel(
      helpfulSignal.key,
      getContextBand(helpfulSignal)
    )}. Try treating that as a setup, not an accident.`;
  }

  if (supportiveTag) {
    return `#${supportiveTag.tag} keeps showing up around better moods, so it is worth testing on a day that is only average rather than already easy.`;
  }

  if (helpfulSignal) {
    return `The clearer lift right now comes from ${describeContextLevel(
      helpfulSignal.key,
      getContextBand(helpfulSignal)
    )}. Try protecting that before the day gets busy.`;
  }

  if (bestWeekday) {
    return `${bestWeekday.label} has been steadier lately. Reuse one part of that day's pace, routine, or expectations on a tougher day.`;
  }

  return "When a day feels a little lighter than expected, note one thing that was different and repeat it once this week.";
}

function pushUniqueLens(cards: AnalysisLensData[], next: AnalysisLensData) {
  if (cards.some((card) => card.title === next.title)) return;
  cards.push(next);
}

function pushUniqueExperiment(cards: ExperimentCardData[], next: ExperimentCardData) {
  if (cards.some((card) => card.title === next.title)) return;
  cards.push(next);
}

function buildPriorityExperiment(args: {
  supportiveTag?: CountedTag;
  challengingTag?: CountedTag;
  sleepSignal?: ContextSignal | null;
  stressSignal?: ContextSignal | null;
  energySignal?: ContextSignal | null;
  bestWeekday?: BestWeekday;
}) {
  if (args.stressSignal?.delta != null && args.stressSignal.delta <= -0.8) {
    return {
      label: "Main focus",
      title: args.challengingTag
        ? `Plan for #${args.challengingTag.tag} days before they peak.`
        : "Reduce the pressure before the day peaks.",
      detail: args.challengingTag
        ? `Stress is the clearest drag right now, and #${args.challengingTag.tag} appears around harder days. The highest-value move is to lower load earlier on those days instead of trying to recover after they turn heavy.`
        : "Stress is the clearest drag right now, so the highest-value move is to lower load earlier in the day instead of trying to recover after the crash.",
    };
  }

  if (args.sleepSignal?.delta != null && args.sleepSignal.delta >= 0.8) {
    return {
      label: "Main focus",
      title: "Protect sleep like a foundation, not a bonus.",
      detail:
        "Sleep is one of the strongest positive signals in your logs. If you only change one thing this week, defend the minimum sleep setup that makes the next day noticeably easier.",
    };
  }

  if (args.supportiveTag && args.challengingTag) {
    return {
      label: "Main focus",
      title: `Move #${args.supportiveTag.tag} closer to #${args.challengingTag.tag} days.`,
      detail: `Your better days and harder days are already pointing to a usable pattern. Instead of adding something new, pull #${args.supportiveTag.tag} earlier into the days that usually carry #${args.challengingTag.tag}.`,
    };
  }

  if (args.energySignal?.delta != null && args.energySignal.delta >= 0.8) {
    return {
      label: "Main focus",
      title: "Match your plans to your energy more aggressively.",
      detail:
        "Energy is acting like a strong lever. The most useful test now is to shrink demands sooner on low-energy days instead of expecting the same version of yourself every day.",
    };
  }

  if (args.supportiveTag) {
    return {
      label: "Main focus",
      title: `Repeat #${args.supportiveTag.tag} on purpose this week.`,
      detail: `#${args.supportiveTag.tag} keeps showing up around better moods, so it is worth turning into a deliberate support instead of leaving it to chance.`,
    };
  }

  if (args.bestWeekday) {
    return {
      label: "Main focus",
      title: `Copy one thing from your recent ${args.bestWeekday.label}.`,
      detail: `${args.bestWeekday.label} seems steadier than your other days. The best next move may be borrowing one part of that day's pace, boundaries, or routine.`,
    };
  }

  return {
    label: "Main focus",
    title: "Keep the next experiment very small.",
    detail:
      "The pattern is forming, but the safest move is still one small repeatable test rather than a big self-improvement plan.",
  };
}

function createMoodSummaryFromEntries(entries: MoodEntry[]) {
  const summary: MoodSummary = {
    happy: 0,
    neutral: 0,
    sad: 0,
    anxious: 0,
    angry: 0,
  };

  for (const entry of entries) {
    summary[entry.mood] += 1;
  }

  return summary;
}

function getRecentMoodBalance(entries: MoodEntry[], recentCount = 7) {
  const recentEntries = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-recentCount);

  return summarizeMoodBalance(createMoodSummaryFromEntries(recentEntries));
}

function getNarrativeTimeframe(entries: MoodEntry[]) {
  const ordered = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const count = ordered.length;

  if (count <= 3) {
    return {
      label: "your first few check-ins",
      adverb: "so far",
      subject: "these first few check-ins",
    };
  }

  if (count <= 6) {
    return {
      label: "your last few check-ins",
      adverb: "recently",
      subject: "those recent check-ins",
    };
  }

  const recent = ordered.slice(-7);
  const first = recent[0];
  const last = recent[recent.length - 1];

  if (first && last) {
    const spanDays = Math.round(
      (parseISODateLocal(last.date).getTime() - parseISODateLocal(first.date).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (spanDays <= 7) {
      return {
        label: "this week",
        adverb: "this week",
        subject: "this week",
      };
    }
  }

  return {
    label: "your recent check-ins",
    adverb: "lately",
    subject: "those recent check-ins",
  };
}

function hasStrongStressDrag(signal?: ContextSignal | null) {
  return signal?.key === "stress" && (signal.delta ?? 0) <= -0.8;
}

function hasClearLift(signal?: ContextSignal | null) {
  return (signal?.delta ?? 0) >= 0.8;
}

function getSupportPhrase(args: {
  supportiveTag?: CountedTag;
  sleepSignal?: ContextSignal | null;
  energySignal?: ContextSignal | null;
}) {
  const parts: string[] = [];

  if (args.sleepSignal && hasClearLift(args.sleepSignal)) {
    parts.push("better sleep");
  }

  if (args.energySignal && hasClearLift(args.energySignal)) {
    parts.push("higher energy");
  }

  if (args.supportiveTag) {
    parts.push(`#${args.supportiveTag.tag}`);
  }

  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];

  return `${parts[0]} and ${parts[1]}`;
}

function getDirectionSentence(entries: MoodEntry[]) {
  const lens = buildTrajectoryLens(entries);
  const timeframe = getNarrativeTimeframe(entries);

  if (/trending lighter/i.test(lens.title)) {
    return `Across ${timeframe.label}, things seem to be trending a bit lighter.`;
  }

  if (/trending heavier/i.test(lens.title)) {
    return `Across ${timeframe.label}, things seem to be trending a bit heavier.`;
  }

  return `Across ${timeframe.label}, your mood looks fairly level overall.`;
}

function getRecoverySentence(entries: MoodEntry[]) {
  const lens = buildRecoveryLens(entries);
  const timeframe = getNarrativeTimeframe(entries);

  if (/bounce back/i.test(lens.title)) {
    return `Within ${timeframe.label}, when harder days show up, you usually bounce back by the next check-in.`;
  }

  if (/spill into the next check-in/i.test(lens.title)) {
    return `Within ${timeframe.label}, when harder days show up, they often spill into the next check-in.`;
  }

  if (/mixed/i.test(lens.title)) {
    return `Within ${timeframe.label}, your bounce-back pattern looks mixed.`;
  }

  return "It is still a bit early to read your bounce-back pattern.";
}

function getDriverSentence(args: {
  supportiveTag?: CountedTag;
  strongestContext?: ContextSignal | null;
  sleepSignal?: ContextSignal | null;
  stressSignal?: ContextSignal | null;
  energySignal?: ContextSignal | null;
}) {
  const drag =
    args.stressSignal?.delta != null && args.stressSignal.delta <= -0.3
      ? "Stress looks like the clearest drag"
      : args.strongestContext?.key === "stress" && (args.strongestContext.delta ?? 0) < 0
        ? "Stress may be pulling the week downward"
        : null;

  const supports: string[] = [];

  if (args.sleepSignal?.delta != null && args.sleepSignal.delta >= 0.3) {
    supports.push("better sleep");
  }

  if (args.energySignal?.delta != null && args.energySignal.delta >= 0.3) {
    supports.push("higher energy");
  }

  if (args.supportiveTag) {
    supports.push(`#${args.supportiveTag.tag}`);
  }

  if (drag && supports.length > 0) {
    return `${drag}, while ${supports.slice(0, 2).join(" and ")} seem protective.`;
  }

  if (drag) {
    return `${drag} right now.`;
  }

  if (supports.length > 0) {
    return `${capitalize(supports.slice(0, 2).join(" and "))} seem to support your steadier days.`;
  }

  return "The clearest pattern still seems to be in the surrounding context, not one mood alone.";
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

export function buildAnalysisProfile(args: {
  weekCount: number;
  totalCheckIns: number;
  taggedCount: number;
  contextualCount: number;
  weekSummary: MoodSummary;
  comparison: ScoreComparison;
  mostCommonMood: CommonMood;
  supportiveTag?: CountedTag;
  challengingTag?: CountedTag;
  strongestContext?: ContextSignal | null;
}) {
  const balance = summarizeMoodBalance(args.weekSummary);
  const shift = formatScoreShift(args.comparison.delta);

  if (args.totalCheckIns < 4) {
    return {
      eyebrow: "Early read",
      tone: "steady" as const,
      title: "Your pattern is still forming.",
      body:
        args.weekCount > 0
          ? `You already have ${args.weekCount} recent check-ins, which is enough to start learning from. A few more tagged or context-rich days will make the analysis sharper.`
          : "You have started logging, but there is not enough signal yet to say something fair or specific.",
      evidence: buildEvidenceLine(args.totalCheckIns, args.taggedCount, args.contextualCount),
    };
  }

  if (
    args.strongestContext?.key === "stress" &&
    args.strongestContext.delta != null &&
    args.strongestContext.delta <= -0.3
  ) {
    return {
      eyebrow: "Recent read",
      tone: "care" as const,
      title: "Your mood looks more pressure-sensitive than random.",
      body: args.challengingTag
        ? `Heavier emotions tend to cluster when stress runs high, and #${args.challengingTag.tag} shows up on harder days too. That points to overload as a real driver, not a personal failure.`
        : "Heavier emotions tend to cluster when stress runs high. That points to overload as a real driver, not a personal failure.",
      evidence: buildEvidenceLine(args.totalCheckIns, args.taggedCount, args.contextualCount),
    };
  }

  if (
    args.strongestContext &&
    args.strongestContext.key !== "stress" &&
    args.strongestContext.delta != null &&
    args.strongestContext.delta >= 0.3
  ) {
    return {
      eyebrow: "Recent read",
      tone: "lift" as const,
      title: "Your steadier days seem to have a repeatable base.",
      body: args.supportiveTag
        ? `${capitalize(describeContextLevel(args.strongestContext.key, getContextBand(args.strongestContext)))} and #${args.supportiveTag.tag} often show up when your mood lands lighter. That gives you something concrete to protect and repeat.`
        : `${capitalize(describeContextLevel(args.strongestContext.key, getContextBand(args.strongestContext)))} keeps lining up with better moods. That makes your lighter days look more buildable than accidental.`,
      evidence: buildEvidenceLine(args.totalCheckIns, args.taggedCount, args.contextualCount),
    };
  }

  if (shift && args.comparison.previousCount >= 3 && args.comparison.delta != null) {
    return {
      eyebrow: "Recent read",
      tone: args.comparison.delta >= 0.35 ? ("lift" as const) : ("care" as const),
      title:
        args.comparison.delta >= 0.35
          ? "Something in your recent rhythm may be helping."
          : "This week looks heavier than your recent baseline.",
      body:
        args.comparison.delta >= 0.35
          ? args.supportiveTag
            ? `Compared with last week, things are feeling ${shift}. #${args.supportiveTag.tag} may be part of that shift, so it is worth repeating on purpose.`
            : `Compared with last week, things are feeling ${shift}. Even if it does not feel dramatic from the inside, the data suggests some lift is happening.`
          : args.challengingTag
            ? `Compared with last week, things are feeling ${shift}, with #${args.challengingTag.tag} showing up around the rougher patches. That is a sign to reduce friction, not to judge yourself.`
            : `Compared with last week, things are feeling ${shift}. That usually means the week needs gentler pacing rather than harsher self-talk.`,
      evidence: buildEvidenceLine(args.totalCheckIns, args.taggedCount, args.contextualCount),
    };
  }

  if (balance.hardShare >= 0.6) {
    return {
      eyebrow: "Recent read",
      tone: "care" as const,
      title: "Recent emotions are carrying more weight.",
      body:
        args.mostCommonMood.mood != null
          ? `${capitalize(args.mostCommonMood.mood)} has been showing up most often, and the recent mix leans heavier overall. The useful question now is what helps soften those days sooner.`
          : "The recent mix leans heavier overall. The useful question now is what helps soften those days sooner.",
      evidence: buildEvidenceLine(args.totalCheckIns, args.taggedCount, args.contextualCount),
    };
  }

  if (balance.steadyShare >= 0.65) {
    return {
      eyebrow: "Recent read",
      tone: "steady" as const,
      title: "You look fairly steady, with a few clear pressure points.",
      body: args.challengingTag
        ? `Most recent check-ins sit on the steadier side, but #${args.challengingTag.tag} still appears around the harder dips. That means the goal may be protecting consistency, not reinventing everything.`
        : "Most recent check-ins sit on the steadier side. The next step is finding which conditions keep the steadier days intact when life gets noisier.",
      evidence: buildEvidenceLine(args.totalCheckIns, args.taggedCount, args.contextualCount),
    };
  }

  return {
    eyebrow: "Recent read",
    tone: "steady" as const,
    title: "Your mood looks mixed, but not directionless.",
    body:
      args.mostCommonMood.mood != null
        ? `${capitalize(args.mostCommonMood.mood)} is the most common mood so far, but the bigger story is variation. The useful patterns now are likely hiding in tags, stress, sleep, or energy rather than in one emotion alone.`
        : "The bigger story here is variation. The useful patterns now are likely hiding in tags, stress, sleep, or energy rather than in one emotion alone.",
    evidence: buildEvidenceLine(args.totalCheckIns, args.taggedCount, args.contextualCount),
  };
}

export function buildAnalysisLenses(args: {
  weekSummary: MoodSummary;
  comparison: ScoreComparison;
  mostCommonMood: CommonMood;
  supportiveTag?: CountedTag;
  challengingTag?: CountedTag;
  strongestContext?: ContextSignal | null;
  bestWeekday?: BestWeekday;
  strongestCombo?: ComboHighlight | null;
}) {
  const cards: AnalysisLensData[] = [];
  const balance = summarizeMoodBalance(args.weekSummary);

  if (balance.total > 0) {
    let title = "Your emotional mix is still fairly blended.";
    let detail =
      "No single mood is dominating hard enough to explain the week on its own, so the surrounding context matters more here.";
    let tone: AnalysisLensData["tone"] = "neutral";

    if (balance.hardShare >= 0.6) {
      title = "Harder emotions are taking up more space recently.";
      detail =
        args.mostCommonMood.mood != null
          ? `${capitalize(args.mostCommonMood.mood)} has shown up most often, and about ${Math.round(
              balance.hardShare * 100
            )}% of recent check-ins landed on the harder side.`
          : "A clear share of recent check-ins landed on the harder side.";
      tone = "challenging";
    } else if (balance.steadyShare >= 0.65) {
      title = "Your baseline looks relatively steady right now.";
      detail =
        args.mostCommonMood.mood != null
          ? `${capitalize(args.mostCommonMood.mood)} has been the most common mood, and most recent entries sit on the steadier side.`
          : "Most recent entries sit on the steadier side.";
      tone = "supportive";
    } else if (balance.dominantMood) {
      title = `${capitalize(balance.dominantMood)} has been leading, but not taking over.`;
      detail = `${Math.round(balance.dominantShare * 100)}% of recent check-ins lean ${describeDominantMood(
        balance.dominantMood
      )}, which suggests movement rather than one fixed state.`;
    }

    pushUniqueLens(cards, {
      label: "Emotion pattern",
      title,
      detail,
      tone,
    });
  }

  if (args.supportiveTag || (args.strongestContext?.delta ?? 0) >= 0.3) {
    const signal = args.strongestContext;
    pushUniqueLens(cards, {
      label: "What helps",
      title: args.supportiveTag
        ? `#${args.supportiveTag.tag} keeps showing up around better days.`
        : signal
          ? `${capitalize(describeContextLevel(signal.key, getContextBand(signal)))} looks helpful.`
          : "There is an emerging support pattern.",
      detail:
        args.supportiveTag && signal && signal.delta != null && signal.delta >= 0.3
          ? `Better moods seem to cluster around both #${args.supportiveTag.tag} and ${describeContextLevel(
              signal.key,
              getContextBand(signal)
            )}, which makes that combination worth protecting.`
          : args.supportiveTag
            ? `It appears on ${args.supportiveTag.count} better check-ins, so it looks less like a fluke and more like a repeatable support.`
            : signal
              ? `${capitalize(describeContextLevel(signal.key, getContextBand(signal)))} is where the clearest lift shows up in your recent logs.`
              : "The data is pointing to a support pattern, but it is still early.",
      tone: "supportive",
    });
  }

  if (args.challengingTag || (args.strongestContext?.key === "stress" && (args.strongestContext.delta ?? 0) <= -0.3)) {
    const signal = args.strongestContext;
    pushUniqueLens(cards, {
      label: "What adds strain",
      title: args.challengingTag
        ? `#${args.challengingTag.tag} shows up around the heavier dips.`
        : "Stress appears to be pulling days downward.",
      detail:
        args.challengingTag &&
        signal?.key === "stress" &&
        signal.delta != null &&
        signal.delta <= -0.3
          ? `Harder moods seem to arrive when #${args.challengingTag.tag} and higher stress overlap, which makes those days worth planning for earlier.`
          : args.challengingTag
            ? `It appears on ${args.challengingTag.count} harder days, so it may be one of the contexts that deserves a gentler plan.`
            : "High-stress days are the clearest negative signal in your recent logs.",
      tone: "challenging",
    });
  }

  if (args.bestWeekday || args.strongestCombo) {
    pushUniqueLens(cards, {
      label: "Rhythm clue",
      title: args.bestWeekday
        ? `${args.bestWeekday.label} looks like part of your steadier rhythm.`
        : "A repeat combo is shaping your mood.",
      detail: args.strongestCombo
        ? `${args.strongestCombo.features
            .map(formatContextFeatureLabel)
            .map((feature, index) => (index === 0 ? capitalize(feature) : feature))
            .join(" + ")} repeated ${args.strongestCombo.count} times and changed the feel of the day more than your average pattern.`
        : args.bestWeekday
          ? `That does not mean the weekday itself is magic. It may be carrying a different pace, workload, or routine that is worth copying elsewhere.`
          : "A repeat combination is starting to matter in your logs.",
      tone:
        args.strongestCombo?.tone === "challenging"
          ? "challenging"
          : args.bestWeekday
            ? "supportive"
            : "neutral",
    });
  }

  if (cards.length === 0 && args.comparison.delta != null) {
    pushUniqueLens(cards, {
      label: "Momentum",
      title:
        args.comparison.delta >= 0.35
          ? "The recent direction is slightly lighter."
          : args.comparison.delta <= -0.35
            ? "The recent direction is slightly heavier."
            : "The recent direction is fairly stable.",
      detail:
        "There is not enough supporting context yet to explain why, so tagging and context logs will make the next pass more useful.",
      tone:
        args.comparison.delta >= 0.35
          ? "supportive"
          : args.comparison.delta <= -0.35
            ? "challenging"
            : "neutral",
    });
  }

  return cards.slice(0, 4);
}

export function buildAnalysisExperiments(args: {
  supportiveTag?: CountedTag;
  challengingTag?: CountedTag;
  strongestContext?: ContextSignal | null;
  sleepSignal?: ContextSignal | null;
  stressSignal?: ContextSignal | null;
  energySignal?: ContextSignal | null;
  bestWeekday?: BestWeekday;
}) {
  const cards: ExperimentCardData[] = [];
  const helpfulSignal =
    [args.sleepSignal, args.energySignal].find(
      (signal) => signal?.delta != null && signal.delta >= 0.3
    ) ?? null;

  pushUniqueExperiment(cards, {
    ...buildPriorityExperiment(args),
  });

  pushUniqueExperiment(cards, {
    label: "Try next",
    title: getSupportExperimentTitle(args.supportiveTag, helpfulSignal, args.bestWeekday),
    detail: getSupportExperimentDetail(args.supportiveTag, helpfulSignal, args.bestWeekday),
  });

  if (args.challengingTag && args.supportiveTag) {
    pushUniqueExperiment(cards, {
      label: "Buffer harder days",
      title: `Use #${args.supportiveTag.tag} earlier on #${args.challengingTag.tag} days.`,
      detail: `Instead of waiting for a #${args.challengingTag.tag} day to turn heavy, add one small #${args.supportiveTag.tag} action early and see if the mood lands differently.`,
    });
  }

  if (args.stressSignal?.delta != null && args.stressSignal.delta <= -0.3) {
    pushUniqueExperiment(cards, {
      label: "Reduce load",
      title: "Add a reset before stress peaks.",
      detail:
        "Your harder moods seem to cluster on higher-stress days. A short pause before the busiest part of the day is more likely to help than trying to recover after the crash.",
    });
  }

  if (args.sleepSignal?.delta != null && args.sleepSignal.delta >= 0.3) {
    pushUniqueExperiment(cards, {
      label: "Protect recovery",
      title: "Treat sleep like a support, not a bonus.",
      detail:
        "Better-sleep days are landing lighter. Try defending a minimum sleep floor for a few days and watch whether the tone of the day changes.",
    });
  }

  if (args.energySignal?.delta != null && args.energySignal.delta >= 0.3) {
    pushUniqueExperiment(cards, {
      label: "Match the day",
      title: "Scale the plan to your energy instead of forcing one pace.",
      detail:
        "Higher-energy days look easier. On low-energy days, try shrinking the plan early instead of measuring yourself against a high-energy version of you.",
    });
  }

  if (cards.length < 3 && args.bestWeekday) {
    pushUniqueExperiment(cards, {
      label: "Copy the rhythm",
      title: `Reuse one part of your ${args.bestWeekday.label} setup.`,
      detail: `Your recent ${args.bestWeekday.label}s have been steadier. Copy one element of that day's pace, routine, or boundaries onto a harder day this week.`,
    });
  }

  if (cards.length < 3) {
    pushUniqueExperiment(cards, {
      label: "Sharpen the read",
      title: "Add one tag and one context signal on rougher days.",
      detail:
        "The fastest way to make this page more helpful is to tag the harder days and log stress, sleep, or energy so the app can learn what tends to change around them.",
    });
  }

  return cards.slice(0, 3);
}

export function buildNarrativeSummary(args: {
  entries: MoodEntry[];
  supportiveTag?: CountedTag;
  challengingTag?: CountedTag;
  strongestContext?: ContextSignal | null;
  sleepSignal?: ContextSignal | null;
  stressSignal?: ContextSignal | null;
  energySignal?: ContextSignal | null;
  bestWeekday?: BestWeekday;
}) {
  const priority = buildPriorityExperiment(args);
  const direction = getDirectionSentence(args.entries);
  const recovery = getRecoverySentence(args.entries);
  const recoveryLens = buildRecoveryLens(args.entries);
  const trajectoryLens = buildTrajectoryLens(args.entries);
  const volatilityLens = buildVolatilityLens(args.entries);
  const recentBalance = getRecentMoodBalance(args.entries);
  const supportPhrase = getSupportPhrase(args);
  const timeframe = getNarrativeTimeframe(args.entries);

  let tone: HeroTone = "steady";

  if (
    /trending heavier/i.test(direction) ||
    /spill into the next check-in/i.test(recovery) ||
    (args.stressSignal?.delta ?? 0) <= -0.8
  ) {
    tone = "care";
  } else if (
    /trending a bit lighter/i.test(direction) ||
    /bounce back/i.test(recovery) ||
    (args.sleepSignal?.delta ?? 0) >= 0.8 ||
    (args.energySignal?.delta ?? 0) >= 0.8
  ) {
    tone = "lift";
  }

  let summary = `${direction} ${recovery} ${getDriverSentence(args)}`;

  if (args.entries.length < 4) {
    summary =
      `This is still an early read from ${timeframe.label}, but the app is starting to separate the mood itself from the conditions around it. A few more check-ins with tags or context will make the story feel much more personal.`;
  } else if (hasStrongStressDrag(args.stressSignal) && recentBalance.hardShare >= 0.5) {
    summary = args.challengingTag
      ? `Across ${timeframe.label}, this looks less like random bad days and more like a pressure pattern. Stress is the clearest drag, and #${args.challengingTag.tag} keeps showing up around the heavier dips. ${/bounce back/i.test(recoveryLens.title) ? "The good sign is that you often recover after the rougher days." : "Right now the harder days seem to linger more than they release quickly."}`
      : `Across ${timeframe.label}, this looks less like random bad days and more like a pressure pattern. Stress is the clearest drag, and the heavier moods appear to cluster when the load goes up. ${/bounce back/i.test(recoveryLens.title) ? "The good sign is that you often recover after the rougher days." : "Right now the harder days seem to linger more than they release quickly."}`;
  } else if (/trending lighter/i.test(trajectoryLens.title) && (supportPhrase || /bounce back/i.test(recoveryLens.title))) {
    summary = supportPhrase
      ? `There are real signs that you may be rebuilding a bit ${timeframe.adverb}. Across ${timeframe.label}, things are getting lighter, and ${supportPhrase} seem to show up around the steadier days. ${/bounce back/i.test(recoveryLens.title) ? "You also tend to recover fairly well after the harder patches." : "The next step is making those better conditions easier to repeat."}`
      : `There are real signs that you may be rebuilding a bit ${timeframe.adverb}. Across ${timeframe.label}, things are getting lighter, and your harder days do not seem to be fully taking over.`;
  } else if (/swinging more than settling/i.test(volatilityLens.title)) {
    summary = supportPhrase
      ? `Across ${timeframe.label}, the bigger story is volatility more than one fixed mood. Your check-ins are swinging around, which can make ${timeframe.subject} feel confusing, but ${supportPhrase} still seem to mark the steadier pockets.`
      : `Across ${timeframe.label}, the bigger story is volatility more than one fixed mood. Your check-ins are swinging around, which can make ${timeframe.subject} feel confusing even when a pattern exists underneath it.`;
  } else if (recentBalance.steadyShare >= 0.6 && args.challengingTag) {
    summary = supportPhrase
      ? `Across ${timeframe.label}, your baseline looks fairly steady, but it gets punctured in a few repeat places. #${args.challengingTag.tag} seems to be one of those friction points, while ${supportPhrase} look more protective.`
      : `Across ${timeframe.label}, your baseline looks fairly steady, but it gets punctured in a few repeat places. #${args.challengingTag.tag} seems to be one of those friction points, so the goal may be protecting the steady days instead of reinventing the whole week.`;
  } else if (supportPhrase) {
    summary = `Across ${timeframe.label}, your mood looks mixed, but it does not look random. ${capitalize(
      supportPhrase
    )} seem to support the steadier days, and the useful next step is probably repeating those conditions more deliberately.`;
  }

  return {
    eyebrow: "Plain-English read",
    summary,
    focus: priority.title,
    tone,
  };
}

export function buildTrajectoryLens(entries: MoodEntry[]) {
  const recent = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-8);

  if (recent.length < 4) {
    return {
      label: "Direction",
      title: "There is not enough recent history to call a direction yet.",
      detail:
        "Once a few more recent check-ins stack up, this section can tell whether the overall tone is easing, worsening, or holding steady.",
      tone: "neutral" as const,
    };
  }

  const midpoint = Math.floor(recent.length / 2);
  const firstHalf = recent.slice(0, midpoint).map((entry) => ANALYSIS_MOOD_SCORE[entry.mood]);
  const secondHalf = recent.slice(midpoint).map((entry) => ANALYSIS_MOOD_SCORE[entry.mood]);
  const firstAverage = average(firstHalf);
  const secondAverage = average(secondHalf);
  const delta =
    firstAverage == null || secondAverage == null ? 0 : roundToTenth(secondAverage - firstAverage);

  if (delta >= 0.7) {
    return {
      label: "Direction",
      title: "Your recent check-ins are trending lighter.",
      detail: `The latest half of your recent entries is about ${delta.toFixed(
        1
      )} points lighter than the earlier half, which suggests the tone may be easing rather than staying stuck.`,
      tone: "supportive" as const,
    };
  }

  if (delta <= -0.7) {
    return {
      label: "Direction",
      title: "Your recent check-ins are trending heavier.",
      detail: `The latest half of your recent entries is about ${Math.abs(delta).toFixed(
        1
      )} points heavier than the earlier half, which suggests the pressure may be building rather than passing.`,
      tone: "challenging" as const,
    };
  }

  return {
    label: "Direction",
    title: "Your recent direction looks fairly level.",
    detail:
      "The overall tone of your latest entries is not shifting much up or down, so the better clues may be hiding in specific triggers and supports instead of a broad trend.",
    tone: "neutral" as const,
  };
}

export function buildVolatilityLens(entries: MoodEntry[]) {
  const recent = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10);

  if (recent.length < 4) {
    return {
      label: "Stability",
      title: "There is not enough recent data to read volatility yet.",
      detail:
        "A few more recent check-ins will show whether your mood tends to shift sharply between entries or move more gradually.",
      tone: "neutral" as const,
    };
  }

  const scores = recent.map((entry) => ANALYSIS_MOOD_SCORE[entry.mood]);
  const swings: number[] = [];

  for (let index = 1; index < scores.length; index += 1) {
    swings.push(Math.abs(scores[index] - scores[index - 1]));
  }

  const averageSwing = average(swings) ?? 0;

  if (averageSwing >= 1.8) {
    return {
      label: "Stability",
      title: "Your mood is swinging more than settling.",
      detail: `Recent entries are shifting by about ${averageSwing.toFixed(
        1
      )} points from one check-in to the next on average, which can make the week feel unpredictable even when there is a pattern underneath it.`,
      tone: "challenging" as const,
    };
  }

  if (averageSwing <= 0.9) {
    return {
      label: "Stability",
      title: "Your recent mood has been relatively steady entry to entry.",
      detail: `Recent entries are moving by only about ${averageSwing.toFixed(
        1
      )} points between check-ins on average, which suggests the pattern may be more consistent than dramatic.`,
      tone: "supportive" as const,
    };
  }

  return {
    label: "Stability",
    title: "Your recent mood has some movement, but not wild swings.",
    detail: `Recent entries shift by about ${averageSwing.toFixed(
      1
    )} points on average, so the week looks changeable without being completely erratic.`,
    tone: "neutral" as const,
  };
}

export function buildRecoveryLens(entries: MoodEntry[]) {
  const ordered = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let followUps = 0;
  let rebounds = 0;
  let prolonged = 0;

  for (let index = 0; index < ordered.length - 1; index += 1) {
    const current = ordered[index];
    const next = ordered[index + 1];

    if (!current || !next || !isHardMood(current.mood)) continue;

    const diffDays = Math.round(
      (parseISODateLocal(next.date).getTime() - parseISODateLocal(current.date).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (diffDays < 1 || diffDays > 3) continue;

    followUps += 1;

    if (isSteadyMood(next.mood)) {
      rebounds += 1;
    } else if (isHardMood(next.mood)) {
      prolonged += 1;
    }
  }

  if (followUps < 2) {
    return {
      label: "Recovery pattern",
      title: "It is still early to read your bounce-back pattern.",
      detail:
        "Once there are a few more check-ins after harder days, this page can tell whether rough patches usually pass quickly or linger.",
      tone: "neutral" as const,
    };
  }

  const reboundRate = rebounds / followUps;
  const prolongedRate = prolonged / followUps;

  if (reboundRate >= 0.67) {
    return {
      label: "Recovery pattern",
      title: "You often bounce back by the next check-in.",
      detail: `${rebounds} of ${followUps} harder days were followed by a steadier mood within the next few days, which suggests your rough patches may be intense but not always long-lasting.`,
      tone: "supportive" as const,
    };
  }

  if (prolongedRate >= 0.67) {
    return {
      label: "Recovery pattern",
      title: "Harder days tend to spill into the next check-in.",
      detail: `${prolonged} of ${followUps} harder days were followed by another hard mood, so support may matter most right after a difficult day rather than later.`,
      tone: "challenging" as const,
    };
  }

  return {
    label: "Recovery pattern",
    title: "Your bounce-back pattern looks mixed right now.",
    detail: `${rebounds} of ${followUps} harder days eased by the next check-in, while others stayed heavy. The next clue may come from what changes on the days that recover faster.`,
    tone: "neutral" as const,
  };
}

export function buildSignalQualityLens(args: {
  totalCheckIns: number;
  weekCount: number;
  taggedThisWeek: number;
  contextualThisWeek: number;
}) {
  if (args.totalCheckIns < 4 || args.weekCount < 2) {
    return {
      label: "Signal quality",
      title: "The signal is still light, so keep reading this gently.",
      detail:
        "A few more recent check-ins will make the analysis less guessy and more personal.",
      tone: "neutral" as const,
    };
  }

  const tagShare = args.weekCount === 0 ? 0 : args.taggedThisWeek / args.weekCount;
  const contextShare = args.weekCount === 0 ? 0 : args.contextualThisWeek / args.weekCount;

  if (tagShare >= 0.6 && contextShare >= 0.6) {
    return {
      label: "Signal quality",
      title: "This read has enough texture to trust the direction.",
      detail: `${args.taggedThisWeek} of ${args.weekCount} recent days had tags, and ${args.contextualThisWeek} included sleep, stress, or energy. That gives the analysis more than mood alone to work with.`,
      tone: "supportive" as const,
    };
  }

  if (tagShare < 0.4 || contextShare < 0.4) {
    return {
      label: "Signal quality",
      title: "The mood signal is useful, but the reasons are still patchy.",
      detail: `${args.taggedThisWeek} of ${args.weekCount} recent days had tags and ${args.contextualThisWeek} included context, so the app can see the feeling more clearly than the cause.`,
      tone: "challenging" as const,
    };
  }

  return {
    label: "Signal quality",
    title: "This analysis is getting clearer, but not fully grounded yet.",
    detail: `Recent logging has enough detail to hint at patterns, though adding tags or context on a few more days would make the why much stronger.`,
    tone: "neutral" as const,
  };
}
