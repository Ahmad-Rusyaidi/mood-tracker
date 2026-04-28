import type { ReminderWeekday } from "@/types";
import { REMINDER_WEEKDAY_OPTIONS } from "@/utils/reminders";
import type { SummaryRange } from "@/utils/shareSummary";

export const REMINDER_PRESET_TIMES = ["18:00", "20:00", "22:00"] as const;

export const SUMMARY_RANGE_OPTIONS: { value: SummaryRange; label: string }[] = [
  { value: "last7", label: "Last 7 days" },
  { value: "thisMonth", label: "This month" },
  { value: "last3Months", label: "Last 3 months" },
];

export function formatSelectedWeekdays(weekdays: ReminderWeekday[]) {
  if (weekdays.length === REMINDER_WEEKDAY_OPTIONS.length) {
    return "Every day";
  }

  const weekdayKey = [1, 2, 3, 4, 5];
  if (
    weekdays.length === weekdayKey.length &&
    weekdayKey.every((day) => weekdays.includes(day as ReminderWeekday))
  ) {
    return "Weekdays";
  }

  return REMINDER_WEEKDAY_OPTIONS.filter((option) => weekdays.includes(option.value))
    .map((option) => option.shortLabel)
    .join(", ");
}
