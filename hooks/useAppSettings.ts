import { appSettingsStorage } from "@/storage";
import type { AppSettings } from "@/types";
import { useCallback, useEffect, useState } from "react";

const DEFAULT_SETTINGS: AppSettings = {
  customTags: [],
  reminders: {
    enabled: false,
    time: "20:00",
  },
};

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
    resetSettings,
  };
}
