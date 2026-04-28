import { appSettingsStorage, getDefaultAppSettings } from "@/storage";
import type { AppSettings, ReminderWeekday } from "@/types";
import { useEffect, useMemo, useSyncExternalStore } from "react";

type AppSettingsState = {
  isLoading: boolean;
  settings: AppSettings;
};

const DEFAULT_SETTINGS = getDefaultAppSettings();

let state: AppSettingsState = {
  isLoading: true,
  settings: DEFAULT_SETTINGS,
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

function setState(next: AppSettingsState) {
  state = next;
  emitChange();
}

async function refreshAppSettings() {
  if (refreshPromise) return refreshPromise;

  setState({
    ...state,
    isLoading: true,
  });

  refreshPromise = (async () => {
    try {
      const settings = await appSettingsStorage.getAll();
      setState({
        isLoading: false,
        settings,
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

function ensureAppSettingsLoaded() {
  if (hasLoaded) return;
  hasLoaded = true;
  void refreshAppSettings();
}

function applySettings(next: AppSettings) {
  setState({
    isLoading: false,
    settings: next,
  });
}

async function addCustomTag(tag: string) {
  const next = await appSettingsStorage.addCustomTag(tag);
  applySettings(next);
  return next;
}

async function removeCustomTag(tag: string) {
  const next = await appSettingsStorage.removeCustomTag(tag);
  applySettings(next);
  return next;
}

async function setReminderEnabled(enabled: boolean) {
  const next = await appSettingsStorage.setReminderEnabled(enabled);
  applySettings(next);
  return next;
}

async function setReminderTime(time: string) {
  const next = await appSettingsStorage.setReminderTime(time);
  applySettings(next);
  return next;
}

async function setReminderWeekdays(weekdays: ReminderWeekday[]) {
  const next = await appSettingsStorage.setReminderWeekdays(weekdays);
  applySettings(next);
  return next;
}

async function setReminderSkipIfLogged(skipIfLogged: boolean) {
  const next = await appSettingsStorage.setReminderSkipIfLogged(skipIfLogged);
  applySettings(next);
  return next;
}

async function resetSettings() {
  await appSettingsStorage.reset();
  applySettings(getDefaultAppSettings());
}

export function useAppSettings() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    ensureAppSettingsLoaded();
  }, []);

  return useMemo(
    () => ({
      settings: snapshot.settings,
      isLoading: snapshot.isLoading,
      refresh: refreshAppSettings,
      addCustomTag,
      removeCustomTag,
      setReminderEnabled,
      setReminderTime,
      setReminderWeekdays,
      setReminderSkipIfLogged,
      resetSettings,
    }),
    [snapshot.isLoading, snapshot.settings]
  );
}
