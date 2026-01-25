import type { Mood, MoodEntry } from "@/types";
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
  return parsed ?? {};
}

async function writeMap(map: MoodEntriesMap): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.moodEntries, toJson(map));
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
};
