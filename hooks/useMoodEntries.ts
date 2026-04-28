import { moodStorage } from "@/storage";
import type { ContextScale, Mood, MoodContextKey, MoodEntry } from "@/types";
import { syncMoodReminderScheduleAsync } from "@/utils/reminders";
import { useEffect, useMemo, useSyncExternalStore } from "react";

type MoodEntriesMap = Record<string, MoodEntry>;

type MoodEntriesState = {
  isLoading: boolean;
  map: MoodEntriesMap;
};

function toMap(entries: MoodEntry[]): MoodEntriesMap {
  const map: MoodEntriesMap = {};
  for (const entry of entries) {
    map[entry.date] = entry;
  }
  return map;
}

let state: MoodEntriesState = {
  isLoading: true,
  map: {},
};

let hasLoaded = false;
let refreshPromise: Promise<void> | null = null;

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

function setState(next: MoodEntriesState) {
  state = next;
  emitChange();
}

async function refreshMoodEntries() {
  if (refreshPromise) return refreshPromise;

  setState({
    ...state,
    isLoading: true,
  });

  refreshPromise = (async () => {
    try {
      const entries = await moodStorage.getAll();
      setState({
        isLoading: false,
        map: toMap(entries),
      });
    } finally {
      refreshPromise = null;
      if (state.isLoading) {
        setState({
          ...state,
          isLoading: false,
        });
      }
    }
  })();

  return refreshPromise;
}

function ensureMoodEntriesLoaded() {
  if (hasLoaded) return;
  hasLoaded = true;
  void refreshMoodEntries();
}

function upsertEntry(entry: MoodEntry) {
  setState({
    isLoading: false,
    map: {
      ...state.map,
      [entry.date]: entry,
    },
  });
}

async function setMoodForDate(date: string, mood: Mood) {
  const entry = await moodStorage.setMoodForDate(date, mood);
  upsertEntry(entry);
  void syncMoodReminderScheduleAsync({ requestPermissions: false });
  return entry;
}

async function setTagsForDate(date: string, tags: string[]) {
  const entry = await moodStorage.setTagsForDate(date, tags);
  upsertEntry(entry);
  return entry;
}

async function setNoteForDate(date: string, note: string) {
  const entry = await moodStorage.setNoteForDate(date, note);
  upsertEntry(entry);
  return entry;
}

async function setContextForDate(
  date: string,
  key: MoodContextKey,
  value: ContextScale | null
) {
  const entry = await moodStorage.setContextForDate(date, key, value);
  upsertEntry(entry);
  return entry;
}

async function removeByDate(date: string) {
  await moodStorage.removeByDate(date);

  if (state.map[date]) {
    const nextMap = { ...state.map };
    delete nextMap[date];
    setState({
      isLoading: false,
      map: nextMap,
    });
  }

  void syncMoodReminderScheduleAsync({ requestPermissions: false });
}

export function useMoodEntries() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    ensureMoodEntriesLoaded();
  }, []);

  const entries = useMemo(() => {
    return Object.values(snapshot.map).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [snapshot.map]);

  return useMemo(
    () => ({
      isLoading: snapshot.isLoading,
      entries,
      map: snapshot.map,
      refresh: refreshMoodEntries,
      getByDate: (date: string) => snapshot.map[date] ?? null,
      setMoodForDate,
      setTagsForDate,
      setNoteForDate,
      setContextForDate,
      removeByDate,
    }),
    [entries, snapshot.isLoading, snapshot.map]
  );
}
