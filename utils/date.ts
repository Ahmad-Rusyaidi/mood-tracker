// utils/date.ts
export function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

// Local date -> "YYYY-MM-DD"
export function toISODateLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseISODateLocal(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getMillisecondsUntilNextLocalDay(now = new Date()) {
  const currentDay = startOfDay(now);
  const nextDay = new Date(currentDay);
  nextDay.setDate(currentDay.getDate() + 1);
  return Math.max(1, nextDay.getTime() - now.getTime());
}

export function isFutureISODate(iso: string, now = new Date()) {
  return iso > toISODateLocal(now);
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

export function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

// 0=Sun..6=Sat
export function dayOfWeek(d: Date) {
  return d.getDay();
}

export function monthLabel(d: Date) {
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}
