import type { AppSettings } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { safeJsonParse, toJson } from "./json";
import { StorageKeys } from "./keys";

const DEFAULT_SETTINGS: AppSettings = {
  customTags: [],
  reminders: {
    enabled: false,
    time: "20:00",
  },
};

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
}

function sanitizeTags(tags: string[]) {
  return Array.from(new Set(tags.map(normalizeTag).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export function getDefaultAppSettings(): AppSettings {
  return {
    customTags: [...DEFAULT_SETTINGS.customTags],
    reminders: { ...DEFAULT_SETTINGS.reminders },
  };
}

async function readSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(StorageKeys.appSettings);
  const parsed = safeJsonParse<AppSettings>(raw);

  if (!parsed) return getDefaultAppSettings();

  return {
    customTags: sanitizeTags(parsed.customTags ?? []),
    reminders: {
      enabled: parsed.reminders?.enabled ?? DEFAULT_SETTINGS.reminders.enabled,
      time: parsed.reminders?.time ?? DEFAULT_SETTINGS.reminders.time,
    },
  };
}

async function writeSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.appSettings, toJson(settings));
}

export const appSettingsStorage = {
  async getAll(): Promise<AppSettings> {
    return readSettings();
  },

  async addCustomTag(tag: string): Promise<AppSettings> {
    const settings = await readSettings();
    const next = sanitizeTags([...settings.customTags, tag]);
    const updated = { ...settings, customTags: next };
    await writeSettings(updated);
    return updated;
  },

  async removeCustomTag(tag: string): Promise<AppSettings> {
    const settings = await readSettings();
    const needle = normalizeTag(tag);
    const updated = {
      ...settings,
      customTags: settings.customTags.filter((item) => item !== needle),
    };
    await writeSettings(updated);
    return updated;
  },

  async setReminderEnabled(enabled: boolean): Promise<AppSettings> {
    const settings = await readSettings();
    const updated = {
      ...settings,
      reminders: {
        ...settings.reminders,
        enabled,
      },
    };
    await writeSettings(updated);
    return updated;
  },

  async setReminderTime(time: string): Promise<AppSettings> {
    const settings = await readSettings();
    const updated = {
      ...settings,
      reminders: {
        ...settings.reminders,
        time,
      },
    };
    await writeSettings(updated);
    return updated;
  },

  async reset(): Promise<void> {
    await AsyncStorage.removeItem(StorageKeys.appSettings);
  },
};
