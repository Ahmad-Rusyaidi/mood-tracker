import { useMoodEntries } from "@/hooks/useMoodEntries";
import type { MoodContextKey } from "@/types";
import {
  countLoggedDaysInMonth,
  countLoggedDaysInWeek,
  getComboHighlights,
  getContextCoverage,
  getContextSignals,
  getEntriesForWeek,
  getEntriesForMonth,
  getLongestMoodStreak,
  getMonthComparison,
  getMonthSummary,
  getMostCommonMood,
  getMoodStreak,
  getTopChallengingTags,
  getTopSupportiveTags,
  getTopTags,
  getTopTagsForMoods,
  getWeekComparison,
  getWeekSummary,
  getWeekWarnings,
  getWeekdayInsights,
} from "@/utils/moodStats";
import {
  buildAnalysisExperiments,
  buildAnalysisLenses,
  buildAnalysisProfile,
  buildNarrativeSummary,
  buildRecoveryLens,
  buildSignalQualityLens,
  buildTrajectoryLens,
  buildVolatilityLens,
  buildEvidenceCards,
  buildPatternCards,
  getActionStory,
  getComparisonConfidenceLabel,
  getContextDrilldownTarget,
  getContextSpotlight,
  getGuidanceCard,
  getMoodMixSummary,
  getMonthStory,
  getWeekdayRhythmSummary,
  getSignalConfidenceLabel,
  getWeekStory,
  type ContextDrilldownTarget,
} from "@/utils/insights";
import { toISODateLocal } from "@/utils";
import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useCurrentDate } from "./useCurrentDate";

type SignalCardModel = {
  key: MoodContextKey;
  title: string;
  confidence: string;
  coverage: ReturnType<typeof getContextCoverage>;
  signal: ReturnType<typeof getContextSignals>[number] | null;
  target: ContextDrilldownTarget | null;
};

export function useInsightsScreen() {
  const { width } = useWindowDimensions();
  const { entries, map, isLoading } = useMoodEntries();
  const today = useCurrentDate();
  const todayKey = useMemo(() => toISODateLocal(today), [today]);
  const entriesUpToToday = useMemo(
    () => entries.filter((entry) => entry.date <= todayKey),
    [entries, todayKey]
  );
  const mapUpToToday = useMemo(
    () =>
      Object.fromEntries(Object.entries(map).filter(([date]) => date <= todayKey)),
    [map, todayKey]
  );
  const thisMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today]
  );
  const currentMonthKey = useMemo(
    () => `${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, "0")}`,
    [thisMonth]
  );

  const weekCount = useMemo(
    () => countLoggedDaysInWeek(mapUpToToday, today),
    [mapUpToToday, today]
  );
  const monthCount = useMemo(
    () => countLoggedDaysInMonth(mapUpToToday, thisMonth),
    [mapUpToToday, thisMonth]
  );
  const currentStreak = useMemo(() => {
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;
    return getMoodStreak(mapUpToToday, todayKey);
  }, [mapUpToToday, today]);

  const longestStreak = useMemo(
    () => getLongestMoodStreak(entriesUpToToday),
    [entriesUpToToday]
  );
  const mostCommonMood = useMemo(
    () => getMostCommonMood(entriesUpToToday),
    [entriesUpToToday]
  );
  const weekSummary = useMemo(
    () => getWeekSummary(mapUpToToday, today),
    [mapUpToToday, today]
  );
  const monthSummary = useMemo(
    () => getMonthSummary(mapUpToToday, thisMonth),
    [mapUpToToday, thisMonth]
  );
  const currentWeekEntries = useMemo(
    () => getEntriesForWeek(entriesUpToToday, today),
    [entriesUpToToday, today]
  );
  const currentMonthEntries = useMemo(
    () => getEntriesForMonth(entriesUpToToday, thisMonth),
    [entriesUpToToday, thisMonth]
  );
  const topTags = useMemo(() => getTopTags(entriesUpToToday), [entriesUpToToday]);
  const hardDayTags = useMemo(
    () => getTopTagsForMoods(entriesUpToToday, ["sad", "anxious", "angry"]),
    [entriesUpToToday]
  );
  const supportiveTags = useMemo(
    () => getTopSupportiveTags(entriesUpToToday),
    [entriesUpToToday]
  );
  const challengingTags = useMemo(
    () => getTopChallengingTags(entriesUpToToday),
    [entriesUpToToday]
  );
  const monthSupportiveTags = useMemo(
    () => getTopSupportiveTags(currentMonthEntries),
    [currentMonthEntries]
  );
  const monthChallengingTags = useMemo(
    () => getTopChallengingTags(currentMonthEntries),
    [currentMonthEntries]
  );
  const weekdayInsights = useMemo(
    () => getWeekdayInsights(entriesUpToToday),
    [entriesUpToToday]
  );
  const comparison = useMemo(
    () => getWeekComparison(entriesUpToToday, today),
    [entriesUpToToday, today]
  );
  const monthComparison = useMemo(
    () => getMonthComparison(entriesUpToToday, thisMonth),
    [entriesUpToToday, thisMonth]
  );
  const weekWarnings = useMemo(
    () => getWeekWarnings(entriesUpToToday, today),
    [entriesUpToToday, today]
  );
  const contextSignals = useMemo(
    () => getContextSignals(entriesUpToToday),
    [entriesUpToToday]
  );
  const comboHighlights = useMemo(
    () => getComboHighlights(entriesUpToToday),
    [entriesUpToToday]
  );
  const sleepCoverage = useMemo(
    () => getContextCoverage(entriesUpToToday, "sleep", today),
    [entriesUpToToday, today]
  );
  const stressCoverage = useMemo(
    () => getContextCoverage(entriesUpToToday, "stress", today),
    [entriesUpToToday, today]
  );
  const energyCoverage = useMemo(
    () => getContextCoverage(entriesUpToToday, "energy", today),
    [entriesUpToToday, today]
  );

  const bestWeekday = weekdayInsights[0] ?? null;
  const strongestContext = contextSignals[0] ?? null;
  const strongestCombo = comboHighlights[0] ?? null;
  const sleepSignal = contextSignals.find((signal) => signal.key === "sleep") ?? null;
  const stressSignal = contextSignals.find((signal) => signal.key === "stress") ?? null;
  const energySignal = contextSignals.find((signal) => signal.key === "energy") ?? null;
  const taggedCount = useMemo(
    () => entriesUpToToday.filter((entry) => (entry.tags?.length ?? 0) > 0).length,
    [entriesUpToToday]
  );
  const contextualCount = useMemo(
    () =>
      entriesUpToToday.filter(
        (entry) => entry.sleep != null || entry.stress != null || entry.energy != null
      ).length,
    [entriesUpToToday]
  );
  const taggedThisWeek = useMemo(
    () => currentWeekEntries.filter((entry) => (entry.tags?.length ?? 0) > 0).length,
    [currentWeekEntries]
  );
  const contextualThisWeek = useMemo(
    () =>
      currentWeekEntries.filter(
        (entry) => entry.sleep != null || entry.stress != null || entry.energy != null
      ).length,
    [currentWeekEntries]
  );

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
  const analysisProfile = useMemo(
    () =>
      buildAnalysisProfile({
        weekCount,
        totalCheckIns: entriesUpToToday.length,
        taggedCount,
        contextualCount,
        weekSummary,
        comparison,
        mostCommonMood,
        supportiveTag: supportiveTags[0],
        challengingTag: challengingTags[0],
        strongestContext,
      }),
    [
      weekCount,
      entriesUpToToday.length,
      taggedCount,
      contextualCount,
      weekSummary,
      comparison,
      mostCommonMood,
      supportiveTags,
      challengingTags,
      strongestContext,
    ]
  );
  const analysisLenses = useMemo(
    () =>
      buildAnalysisLenses({
        weekSummary,
        comparison,
        mostCommonMood,
        supportiveTag: supportiveTags[0],
        challengingTag: challengingTags[0],
        strongestContext,
        bestWeekday,
        strongestCombo,
      }),
    [
      weekSummary,
      comparison,
      mostCommonMood,
      supportiveTags,
      challengingTags,
      strongestContext,
      bestWeekday,
      strongestCombo,
    ]
  );
  const analysisExperiments = useMemo(
    () =>
      buildAnalysisExperiments({
        supportiveTag: supportiveTags[0],
        challengingTag: challengingTags[0],
        strongestContext,
        sleepSignal,
        stressSignal,
        energySignal,
        bestWeekday,
        strongestCombo,
      }),
    [
      supportiveTags,
      challengingTags,
      strongestContext,
      sleepSignal,
      stressSignal,
      energySignal,
      bestWeekday,
      strongestCombo,
    ]
  );
  const narrativeSummary = useMemo(
    () =>
      buildNarrativeSummary({
        entries: entriesUpToToday,
        supportiveTag: supportiveTags[0],
        challengingTag: challengingTags[0],
        strongestContext,
        sleepSignal,
        stressSignal,
        energySignal,
        bestWeekday,
        sleepCount: sleepCoverage.totalCount,
        stressCount: stressCoverage.totalCount,
        energyCount: energyCoverage.totalCount,
        strongestCombo,
      }),
    [
      entriesUpToToday,
      supportiveTags,
      challengingTags,
      strongestContext,
      sleepSignal,
      stressSignal,
      energySignal,
      bestWeekday,
      sleepCoverage.totalCount,
      stressCoverage.totalCount,
      energyCoverage.totalCount,
      strongestCombo,
    ]
  );
  const recoveryLens = useMemo(
    () => buildRecoveryLens(entriesUpToToday),
    [entriesUpToToday]
  );
  const signalQualityLens = useMemo(
    () =>
      buildSignalQualityLens({
        totalCheckIns: entriesUpToToday.length,
        weekCount,
        taggedThisWeek,
        contextualThisWeek,
      }),
    [entriesUpToToday.length, weekCount, taggedThisWeek, contextualThisWeek]
  );
  const trajectoryLens = useMemo(
    () => buildTrajectoryLens(entriesUpToToday),
    [entriesUpToToday]
  );
  const volatilityLens = useMemo(
    () => buildVolatilityLens(entriesUpToToday),
    [entriesUpToToday]
  );

  const strongestContextTarget = useMemo(
    () => getContextDrilldownTarget(strongestContext),
    [strongestContext]
  );
  const sleepTarget = useMemo(() => getContextDrilldownTarget(sleepSignal), [sleepSignal]);
  const stressTarget = useMemo(() => getContextDrilldownTarget(stressSignal), [stressSignal]);
  const energyTarget = useMemo(() => getContextDrilldownTarget(energySignal), [energySignal]);

  const signalCards = useMemo<SignalCardModel[]>(
    () => [
      {
        key: "sleep",
        title: "Sleep",
        signal: sleepSignal,
        coverage: sleepCoverage,
        confidence: getSignalConfidenceLabel(sleepSignal),
        target: sleepTarget,
      },
      {
        key: "stress",
        title: "Stress",
        signal: stressSignal,
        coverage: stressCoverage,
        confidence: getSignalConfidenceLabel(stressSignal),
        target: stressTarget,
      },
      {
        key: "energy",
        title: "Energy",
        signal: energySignal,
        coverage: energyCoverage,
        confidence: getSignalConfidenceLabel(energySignal),
        target: energyTarget,
      },
    ],
    [
      sleepSignal,
      sleepCoverage,
      sleepTarget,
      stressSignal,
      stressCoverage,
      stressTarget,
      energySignal,
      energyCoverage,
      energyTarget,
    ]
  );

  const stats = useMemo(
    () => [
      { label: "This week", value: `${weekCount}`, caption: "days logged" },
      { label: "This month", value: `${monthCount}`, caption: "days logged" },
      { label: "Streak", value: `${currentStreak}`, caption: "current run" },
      { label: "Best run", value: `${longestStreak}`, caption: "longest streak" },
    ],
    [weekCount, monthCount, currentStreak, longestStreak]
  );

  return {
    screenState: isLoading ? "loading" : entriesUpToToday.length === 0 ? "empty" : "ready",
    currentMonthKey,
    layout: {
      signalCardWidth: Math.min(Math.max(width - 56, 260), 312),
      twoUpAnalysis: width >= 430,
      twoUpPatterns: width >= 430,
      twoUpSpotlights: width >= 440,
      twoUpDetails: width >= 430,
    },
    weekly: {
      stats,
      weekStory,
      actionHint,
      guidanceCard,
      monthStory,
      warnings: weekWarnings,
      monthComparisonConfidence: getComparisonConfidenceLabel(
        monthComparison.currentCount,
        monthComparison.previousCount
      ),
      mostCommonMood,
    },
    analysis: {
      narrative: narrativeSummary,
      profile: analysisProfile,
      lenses: [
        ...analysisLenses,
        trajectoryLens,
        volatilityLens,
        recoveryLens,
        signalQualityLens,
      ],
      experiments: analysisExperiments,
    },
    highlights: {
      evidenceCards,
      contextSpotlight,
      strongestContextTarget,
      patternCards,
      weekdayInsights,
      signalCards,
    },
    breakdown: {
      weekSummary,
      monthSummary,
      weekSummaryText: getMoodMixSummary(weekSummary, "this week"),
      monthSummaryText: getMoodMixSummary(monthSummary, "this month"),
      weekdaySummaryText: getWeekdayRhythmSummary(weekdayInsights),
      topTags,
      hardDayTags,
    },
  };
}
