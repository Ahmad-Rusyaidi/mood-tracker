// storage/keys.ts
export const StorageKeys = {
  moodEntries: "mood_entries_v1",
  appSettings: "app_settings_v1",
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
