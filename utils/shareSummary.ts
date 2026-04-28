import type { MoodEntry } from "@/types";
import {
  getContextSignals,
  getEntriesForMonth,
  getEntriesForWeek,
  getMonthComparison,
  getMostCommonMood,
  getTopChallengingTags,
  getTopSupportiveTags,
  getWeekComparison,
} from "@/utils/moodStats";

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function formatShift(delta: number | null, larger = "lighter", smaller = "heavier") {
  if (delta == null) return null;
  if (delta >= 0.8) return `noticeably ${larger}`;
  if (delta >= 0.35) return `slightly ${larger}`;
  if (delta <= -0.8) return `noticeably ${smaller}`;
  if (delta <= -0.35) return `slightly ${smaller}`;
  return "fairly similar";
}

function formatMoodLabel(mood: ReturnType<typeof getMostCommonMood>["mood"]) {
  if (!mood) return "mixed";
  return mood;
}

export function buildReadableSummary(entries: MoodEntry[], today = new Date()) {
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const weekEntries = getEntriesForWeek(entries, today);
  const monthEntries = getEntriesForMonth(entries, thisMonth);
  const weekComparison = getWeekComparison(entries, today);
  const monthComparison = getMonthComparison(entries, thisMonth);
  const supportiveTag = getTopSupportiveTags(entries, 1)[0];
  const challengingTag = getTopChallengingTags(entries, 1)[0];
  const strongestSignal = getContextSignals(entries)[0] ?? null;
  const commonMood = getMostCommonMood(monthEntries);

  const weekShift = formatShift(weekComparison.delta);
  const monthShift = formatShift(monthComparison.delta);

  const lines = [
    "Mood tracker summary",
    `Created ${today.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    "",
    `This week: ${weekEntries.length} check-in${weekEntries.length === 1 ? "" : "s"}.`,
    weekShift && weekComparison.previousCount >= 3
      ? `Compared with last week, things felt ${weekShift}.`
      : "There is not quite enough week-over-week data for a strong comparison yet.",
    "",
    `${formatMonthLabel(thisMonth)}: ${monthEntries.length} check-in${monthEntries.length === 1 ? "" : "s"}.`,
    monthShift && monthComparison.previousCount >= 3
      ? `Compared with last month, things felt ${monthShift}.`
      : "There is not quite enough month-over-month data for a strong comparison yet.",
    `Most common mood this month: ${formatMoodLabel(commonMood.mood)}.`,
  ];

  if (supportiveTag || challengingTag || strongestSignal) {
    lines.push("", "Patterns that may matter:");
  }

  if (supportiveTag) {
    lines.push(
      `- #${supportiveTag.tag} often showed up on better days (${supportiveTag.count} check-ins).`
    );
  }

  if (challengingTag) {
    lines.push(
      `- #${challengingTag.tag} often showed up on tougher days (${challengingTag.count} check-ins).`
    );
  }

  if (strongestSignal?.delta != null) {
    if (strongestSignal.key === "stress") {
      lines.push(
        strongestSignal.delta < 0
          ? "- Higher-stress days usually felt harder."
          : "- Lower-stress days looked steadier."
      );
    } else if (strongestSignal.key === "sleep") {
      lines.push(
        strongestSignal.delta >= 0
          ? "- Better-sleep days usually felt better."
          : "- Lower-sleep days often felt harder."
      );
    } else {
      lines.push(
        strongestSignal.delta >= 0
          ? "- Higher-energy days usually felt better."
          : "- Lower-energy days often felt harder."
      );
    }
  }

  lines.push(
    "",
    "These patterns are suggestions, not certainties. Small sample sizes can change the story."
  );

  return lines.join("\n");
}
