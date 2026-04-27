export const DEFAULT_REMINDER_TIME = "20:00";

export function normalizeReminderTime(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function parseReminderTime(value: string) {
  const normalized = normalizeReminderTime(value) ?? DEFAULT_REMINDER_TIME;
  const [hours, minutes] = normalized.split(":").map(Number);

  return {
    hours: hours ?? 20,
    minutes: minutes ?? 0,
  };
}

export function formatReminderTime(value: string) {
  const { hours, minutes } = parseReminderTime(value);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}
