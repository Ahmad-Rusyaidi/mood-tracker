import { appSettingsStorage, getDefaultAppSettings } from "@/storage";
import type { AppSettings, ReminderWeekday } from "@/types";
import { useCallback, useEffect, useState } from "react";

const DEFAULT_SETTINGS: AppSettings = getDefaultAppSettings();

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await appSettingsStorage.getAll();
      setSettings(next);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addCustomTag = useCallback(async (tag: string) => {
    const next = await appSettingsStorage.addCustomTag(tag);
    setSettings(next);
    return next;
  }, []);

  const removeCustomTag = useCallback(async (tag: string) => {
    const next = await appSettingsStorage.removeCustomTag(tag);
    setSettings(next);
    return next;
  }, []);

  const setReminderEnabled = useCallback(async (enabled: boolean) => {
    const next = await appSettingsStorage.setReminderEnabled(enabled);
    setSettings(next);
    return next;
  }, []);

  const setReminderTime = useCallback(async (time: string) => {
    const next = await appSettingsStorage.setReminderTime(time);
    setSettings(next);
    return next;
  }, []);

  const setReminderWeekdays = useCallback(async (weekdays: ReminderWeekday[]) => {
    const next = await appSettingsStorage.setReminderWeekdays(weekdays);
    setSettings(next);
    return next;
  }, []);

  const setReminderSkipIfLogged = useCallback(async (skipIfLogged: boolean) => {
    const next = await appSettingsStorage.setReminderSkipIfLogged(skipIfLogged);
    setSettings(next);
    return next;
  }, []);

  const resetSettings = useCallback(async () => {
    await appSettingsStorage.reset();
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    isLoading,
    refresh,
    addCustomTag,
    removeCustomTag,
    setReminderEnabled,
    setReminderTime,
    setReminderWeekdays,
    setReminderSkipIfLogged,
    resetSettings,
  };
}
