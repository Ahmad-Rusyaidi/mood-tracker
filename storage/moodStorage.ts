// storage/moodStorage.ts
import { MOODS, type ContextScale, type Mood, type MoodContextKey, type MoodEntry } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { safeJsonParse, toJson } from "./json";
import { StorageKeys } from "./keys";

type MoodEntriesMap = Record<string, MoodEntry>; // key = YYYY-MM-DD

function now() {
  return Date.now();
}

async function readMap(): Promise<MoodEntriesMap> {
  const raw = await AsyncStorage.getItem(StorageKeys.moodEntries);
  const parsed = safeJsonParse<MoodEntriesMap>(raw);
  if (!parsed) return {};

  const sanitized: MoodEntriesMap = {};
  for (const entry of Object.values(parsed)) {
    const clean = sanitizeEntry(entry);
    if (!clean) continue;
    sanitized[clean.date] = clean;
  }

  return sanitized;
}

async function writeMap(map: MoodEntriesMap): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.moodEntries, toJson(map));
}

function getBaseEntry(date: string, existing?: MoodEntry): MoodEntry {
  return existing ?? { date, mood: "neutral", createdAt: now(), updatedAt: now() };
}

function cleanContextValue(value: ContextScale | null | undefined): ContextScale | undefined {
  if (value == null) return undefined;
  return Math.max(1, Math.min(5, value)) as ContextScale;
}

function isValidMood(value: unknown): value is Mood {
  return typeof value === "string" && MOODS.includes(value as Mood);
}

function normalizeISODate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== (month ?? 1) - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return value;
}

function sanitizeEntry(entry: MoodEntry): MoodEntry | null {
  const date = normalizeISODate(entry.date);
  if (!date || !isValidMood(entry.mood)) return null;

  const tags = Array.isArray(entry.tags)
    ? Array.from(new Set(entry.tags.map((tag) => tag.trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      )
    : undefined;
  const createdAt = Number.isFinite(entry.createdAt) ? entry.createdAt : now();
  const updatedAt = Number.isFinite(entry.updatedAt) ? entry.updatedAt : createdAt;

  return {
    date,
    mood: entry.mood,
    createdAt,
    updatedAt,
    ...(tags && tags.length > 0 ? { tags } : {}),
    ...(cleanContextValue(entry.energy) ? { energy: cleanContextValue(entry.energy) } : {}),
    ...(cleanContextValue(entry.stress) ? { stress: cleanContextValue(entry.stress) } : {}),
    ...(cleanContextValue(entry.sleep) ? { sleep: cleanContextValue(entry.sleep) } : {}),
  };
}

export const moodStorage = {
  async getAll(): Promise<MoodEntry[]> {
    const map = await readMap();
    // sort newest -> oldest by date string
    return Object.values(map).sort((a, b) => (a.date < b.date ? 1 : -1));
  },

  async getByDate(date: string): Promise<MoodEntry | null> {
    const map = await readMap();
    return map[date] ?? null;
  },

  async setMoodForDate(date: string, mood: Mood): Promise<MoodEntry> {
    const map = await readMap();
    const existing = map[date];

    const entry: MoodEntry = existing
      ? { ...existing, mood, updatedAt: now() }
      : { date, mood, createdAt: now(), updatedAt: now() };

    map[date] = entry;
    await writeMap(map);
    return entry;
  },

  async removeByDate(date: string): Promise<void> {
    const map = await readMap();
    if (!map[date]) return;
    delete map[date];
    await writeMap(map);
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(StorageKeys.moodEntries);
  },

  async replaceAll(entries: MoodEntry[]): Promise<MoodEntry[]> {
    const map: MoodEntriesMap = {};

    for (const rawEntry of entries) {
      const entry = sanitizeEntry(rawEntry);
      if (!entry) continue;
      map[entry.date] = entry;
    }

    await writeMap(map);
    return Object.values(map).sort((a, b) => (a.date < b.date ? 1 : -1));
  },

  async setTagsForDate(date: string, tags: string[]): Promise<MoodEntry> {
    const map = await readMap();
    const existing = map[date];

    const cleaned = Array.from(
      new Set(tags.map((t) => t.trim()).filter(Boolean))
    );

    const entry: MoodEntry = {
      ...getBaseEntry(date, existing),
      tags: cleaned,
      updatedAt: now(),
    };

    map[date] = entry;
    await writeMap(map);
    return entry;
  },

  async setContextForDate(
    date: string,
    key: MoodContextKey,
    value: ContextScale | null
  ): Promise<MoodEntry> {
    const map = await readMap();
    const existing = map[date];
    const cleanedValue = cleanContextValue(value);
    const baseEntry = getBaseEntry(date, existing);
    const entry: MoodEntry = {
      ...baseEntry,
      updatedAt: now(),
    };

    if (cleanedValue === undefined) {
      delete entry[key];
    } else {
      entry[key] = cleanedValue;
    }

    map[date] = entry;
    await writeMap(map);
    return entry;
  },
};
