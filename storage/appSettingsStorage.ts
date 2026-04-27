import type { AppSettings, ReminderWeekday } from "@/types";
import { REMINDER_WEEKDAYS } from "@/types";
import { DEFAULT_REMINDER_TIME, normalizeReminderTime } from "@/utils/reminderTime";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { safeJsonParse, toJson } from "./json";
import { StorageKeys } from "./keys";

const DEFAULT_SETTINGS: AppSettings = {
  customTags: [],
  reminders: {
    enabled: false,
    time: DEFAULT_REMINDER_TIME,
    weekdays: [...REMINDER_WEEKDAYS],
    skipIfLogged: true,
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

function sanitizeReminderWeekdays(value: unknown): ReminderWeekday[] {
  if (!Array.isArray(value)) return [...REMINDER_WEEKDAYS];

  const weekdays = Array.from(
    new Set(
      value
        .map((day) => Number(day))
        .filter((day): day is ReminderWeekday =>
          REMINDER_WEEKDAYS.includes(day as ReminderWeekday)
        )
    )
  ).sort((a, b) => a - b);

  return weekdays.length > 0 ? weekdays : [...REMINDER_WEEKDAYS];
}

export function getDefaultAppSettings(): AppSettings {
  return {
    customTags: [...DEFAULT_SETTINGS.customTags],
    reminders: {
      ...DEFAULT_SETTINGS.reminders,
      weekdays: [...DEFAULT_SETTINGS.reminders.weekdays],
    },
  };
}

export function normalizeAppSettings(input: unknown): AppSettings {
  const base = getDefaultAppSettings();
  const parsed =
    input && typeof input === "object" ? (input as Partial<AppSettings>) : undefined;

  return {
    customTags: sanitizeTags(parsed?.customTags ?? []),
    reminders: {
      enabled: parsed?.reminders?.enabled ?? base.reminders.enabled,
      time: normalizeReminderTime(parsed?.reminders?.time ?? "") ?? base.reminders.time,
      weekdays: sanitizeReminderWeekdays(parsed?.reminders?.weekdays),
      skipIfLogged: parsed?.reminders?.skipIfLogged ?? base.reminders.skipIfLogged,
    },
  };
}

async function readSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(StorageKeys.appSettings);
  const parsed = safeJsonParse<AppSettings>(raw);
  return normalizeAppSettings(parsed);
}

async function writeSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.appSettings, toJson(normalizeAppSettings(settings)));
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
        time: normalizeReminderTime(time) ?? settings.reminders.time,
      },
    };
    await writeSettings(updated);
    return updated;
  },

  async setReminderWeekdays(weekdays: ReminderWeekday[]): Promise<AppSettings> {
    const settings = await readSettings();
    const updated = {
      ...settings,
      reminders: {
        ...settings.reminders,
        weekdays: sanitizeReminderWeekdays(weekdays),
      },
    };
    await writeSettings(updated);
    return updated;
  },

  async setReminderSkipIfLogged(skipIfLogged: boolean): Promise<AppSettings> {
    const settings = await readSettings();
    const updated = {
      ...settings,
      reminders: {
        ...settings.reminders,
        skipIfLogged,
      },
    };
    await writeSettings(updated);
    return updated;
  },

  async replaceAll(settings: AppSettings): Promise<AppSettings> {
    const normalized = normalizeAppSettings(settings);
    await writeSettings(normalized);
    return normalized;
  },

  async reset(): Promise<void> {
    await AsyncStorage.removeItem(StorageKeys.appSettings);
  },
};
