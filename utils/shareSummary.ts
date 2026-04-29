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
import { toISODateLocal } from "@/utils";

export type SummaryRange = "last7" | "thisMonth" | "last3Months";

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

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getEntriesForRecentDays(entries: MoodEntry[], today: Date, days: number) {
  const end = startOfDay(today);
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));

  return entries.filter((entry) => {
    const [year, month, day] = entry.date.split("-").map(Number);
    const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
    return date >= start && date <= end;
  });
}

function getSummaryHeader(range: SummaryRange, today: Date) {
  if (range === "last7") return "Mood tracker summary: last 7 days";
  if (range === "last3Months") return "Mood tracker summary: last 3 months";
  return `Mood tracker summary: ${formatMonthLabel(new Date(today.getFullYear(), today.getMonth(), 1))}`;
}

export function buildReadableSummary(
  entries: MoodEntry[],
  today = new Date(),
  range: SummaryRange = "thisMonth"
) {
  const visibleEntries = entries.filter((entry) => entry.date <= toISODateLocal(today));
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const weekEntries =
    range === "last7"
      ? getEntriesForRecentDays(visibleEntries, today, 7)
      : getEntriesForWeek(visibleEntries, today);
  const monthEntries =
    range === "last3Months"
      ? getEntriesForRecentDays(visibleEntries, today, 90)
      : range === "last7"
        ? getEntriesForRecentDays(visibleEntries, today, 7)
        : getEntriesForMonth(visibleEntries, thisMonth);
  const weekComparison = getWeekComparison(visibleEntries, today);
  const monthComparison = getMonthComparison(visibleEntries, thisMonth);
  const supportiveTag = getTopSupportiveTags(monthEntries, 1)[0];
  const challengingTag = getTopChallengingTags(monthEntries, 1)[0];
  const strongestSignal = getContextSignals(monthEntries)[0] ?? null;
  const commonMood = getMostCommonMood(monthEntries);

  const weekShift = formatShift(weekComparison.delta);
  const monthShift = formatShift(monthComparison.delta);

  const lines = [
    getSummaryHeader(range, today),
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
    `${range === "last3Months" ? "Last 3 months" : range === "last7" ? "Last 7 days" : formatMonthLabel(thisMonth)}: ${monthEntries.length} check-in${monthEntries.length === 1 ? "" : "s"}.`,
    range === "thisMonth"
      ? monthShift && monthComparison.previousCount >= 3
        ? `Compared with last month, things felt ${monthShift}.`
        : "There is not quite enough month-over-month data for a strong comparison yet."
      : "This summary focuses more on recent patterns than month-over-month comparison.",
    `Most common mood in this range: ${formatMoodLabel(commonMood.mood)}.`,
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
