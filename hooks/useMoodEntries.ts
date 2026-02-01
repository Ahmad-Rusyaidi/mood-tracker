import { moodStorage } from "@/storage";
import type { Mood, MoodEntry } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";

type MoodEntriesMap = Record<string, MoodEntry>; // key = YYYY-MM-DD

function toMap(entries: MoodEntry[]): MoodEntriesMap {
  const map: MoodEntriesMap = {};
  for (const e of entries) map[e.date] = e;
  return map;
}

export function useMoodEntries() {
  const [map, setMap] = useState<MoodEntriesMap>({});
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const entries = await moodStorage.getAll();
      setMap(toMap(entries));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setMoodForDate = useCallback(async (date: string, mood: Mood) => {
    const entry = await moodStorage.setMoodForDate(date, mood);
    setMap((prev) => ({ ...prev, [date]: entry }));
    return entry;
  }, []);

  const setTagsForDate = useCallback(async (date: string, tags: string[]) => {
    const entry = await moodStorage.setTagsForDate(date, tags);
    setMap((prev) => ({ ...prev, [date]: entry }));
    return entry;
  }, []);

  const setNoteForDate = useCallback(async (date: string, note: string) => {
    const entry = await moodStorage.setNoteForDate(date, note);
    setMap((prev) => ({ ...prev, [date]: entry }));
    return entry;
  }, []);

  const removeByDate = useCallback(async (date: string) => {
    await moodStorage.removeByDate(date);
    setMap((prev) => {
      if (!prev[date]) return prev;
      const copy = { ...prev };
      delete copy[date];
      return copy;
    });
  }, []);

  const entries = useMemo(() => {
    return Object.values(map).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [map]);

  const getByDate = useCallback(
    (date: string) => map[date] ?? null,
    [map]
  );

  return {
    isLoading,
    entries,
    map,
    refresh,
    getByDate,
    setMoodForDate,
    setTagsForDate,
    setNoteForDate,
    removeByDate,
  };
}
