import { useAppSettings } from "@/hooks/useAppSettings";
import { useMoodEntries } from "@/hooks/useMoodEntries";
import { moodStorage } from "@/storage";
import type { ReminderWeekday } from "@/types";
import {
  buildBackupFilename,
  exportBackupPayloadAsync,
  importBackupPayloadAsync,
} from "@/utils/backup";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  cancelDailyMoodReminderAsync,
  syncMoodReminderScheduleAsync,
} from "@/utils/reminders";
import { formatReminderTime, normalizeReminderTime } from "@/utils/reminderTime";
import { buildReadableSummary, type SummaryRange } from "@/utils/shareSummary";
import { formatSelectedWeekdays } from "@/utils/settings";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

export function useSettingsScreen() {
  const { entries, refresh: refreshEntries } = useMoodEntries();
  const {
    settings,
    isLoading,
    refresh: refreshSettings,
    addCustomTag,
    removeCustomTag,
    setReminderEnabled,
    setReminderTime,
    setReminderWeekdays,
    setReminderSkipIfLogged,
    resetSettings,
  } = useAppSettings();
  const [tagDraft, setTagDraft] = useState("");
  const [timeDraft, setTimeDraft] = useState(settings.reminders.time);
  const [summaryRange, setSummaryRange] = useState<SummaryRange>("thisMonth");

  useEffect(() => {
    setTimeDraft(settings.reminders.time);
  }, [settings.reminders.time]);

  const summaryPreview = useMemo(
    () => buildReadableSummary(entries, new Date(), summaryRange),
    [entries, summaryRange]
  );

  const reminderSummary = useMemo(() => {
    const daySummary = formatSelectedWeekdays(settings.reminders.weekdays);
    const timeSummary = formatReminderTime(settings.reminders.time);
    const skipSummary = settings.reminders.skipIfLogged
      ? "skips days you already logged"
      : "always sends";
    return `${daySummary} at ${timeSummary}, ${skipSummary}.`;
  }, [settings.reminders]);

  const handleAddTag = async () => {
    const next = tagDraft.trim().toLowerCase();
    if (!next) return;
    await addCustomTag(next);
    setTagDraft("");
  };

  const handleRemoveTag = async (tag: string) => {
    await removeCustomTag(tag);
  };

  const handleReminderToggle = async (enabled: boolean) => {
    const nextSettings = {
      ...settings.reminders,
      enabled,
    };

    await setReminderEnabled(enabled);
    const scheduled = await syncMoodReminderScheduleAsync({
      requestPermissions: enabled,
      settings: nextSettings,
    });

    if (!enabled) return;

    if (!scheduled) {
      Alert.alert(
        "Notifications not allowed",
        "Enable notifications for this app to receive daily check-in reminders."
      );
      await setReminderEnabled(false);
      await syncMoodReminderScheduleAsync({
        requestPermissions: false,
        settings: {
          ...nextSettings,
          enabled: false,
        },
      });
    }
  };

  const handleApplyReminderTime = async (nextValue = timeDraft) => {
    const normalized = normalizeReminderTime(nextValue);
    if (!normalized) {
      Alert.alert("Invalid time", "Use 24-hour time in HH:MM format, like 07:30 or 21:15.");
      setTimeDraft(settings.reminders.time);
      return;
    }

    setTimeDraft(normalized);
    await setReminderTime(normalized);

    if (settings.reminders.enabled) {
      await syncMoodReminderScheduleAsync({
        requestPermissions: false,
        settings: {
          ...settings.reminders,
          time: normalized,
        },
      });
    }
  };

  const handleToggleWeekday = async (day: ReminderWeekday) => {
    const nextWeekdays = settings.reminders.weekdays.includes(day)
      ? settings.reminders.weekdays.filter((item) => item !== day)
      : [...settings.reminders.weekdays, day].sort((a, b) => a - b);

    if (nextWeekdays.length === 0) {
      Alert.alert("Choose at least one day", "Reminders need at least one selected day.");
      return;
    }

    await setReminderWeekdays(nextWeekdays);

    if (settings.reminders.enabled) {
      await syncMoodReminderScheduleAsync({
        requestPermissions: false,
        settings: {
          ...settings.reminders,
          weekdays: nextWeekdays,
        },
      });
    }
  };

  const handleSkipIfLoggedToggle = async (skipIfLogged: boolean) => {
    await setReminderSkipIfLogged(skipIfLogged);

    if (settings.reminders.enabled) {
      await syncMoodReminderScheduleAsync({
        requestPermissions: false,
        settings: {
          ...settings.reminders,
          skipIfLogged,
        },
      });
    }
  };

  const handleExport = async () => {
    const payload = await exportBackupPayloadAsync();
    const backupFile = new File(Paths.document, buildBackupFilename());
    backupFile.create({
      intermediates: true,
      overwrite: true,
    });
    backupFile.write(JSON.stringify(payload, null, 2));

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(backupFile.uri, {
        mimeType: "application/json",
        UTI: "public.json",
        dialogTitle: "Share mood tracker backup",
      });
      return;
    }

    Alert.alert("Backup saved", `Backup file created:\n${backupFile.uri}`);
  };

  const handleShareSummary = async () => {
    if (entries.length === 0) {
      Alert.alert("No summary yet", "Add a few check-ins first so there is something meaningful to share.");
      return;
    }

    const summaryFile = new File(
      Paths.document,
      `mood-tracker-summary-${new Date().toISOString().slice(0, 10)}.txt`
    );
    summaryFile.create({
      intermediates: true,
      overwrite: true,
    });
    summaryFile.write(buildReadableSummary(entries, new Date(), summaryRange));

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(summaryFile.uri, {
        mimeType: "text/plain",
        dialogTitle: "Share mood summary",
      });
      return;
    }

    Alert.alert("Summary saved", `Summary file created:\n${summaryFile.uri}`);
  };

  const handleCopySummary = async () => {
    if (entries.length === 0) {
      Alert.alert("No summary yet", "Add a few check-ins first so there is something meaningful to copy.");
      return;
    }

    await Clipboard.setStringAsync(summaryPreview);
    Alert.alert("Summary copied", "Your readable summary is now on the clipboard.");
  };

  const pickBackupFileText = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "text/plain"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];
    if (!asset?.uri) {
      throw new Error("The selected backup file could not be opened.");
    }

    return new File(asset.uri).text();
  };

  const runImport = async (mode: "merge" | "replace") => {
    try {
      const backupText = await pickBackupFileText();
      if (!backupText) return;

      const result = await importBackupPayloadAsync(backupText, mode);
      await refreshEntries();
      await refreshSettings();
      await syncMoodReminderScheduleAsync({ requestPermissions: false });

      Alert.alert(
        mode === "replace" ? "Backup restored" : "Backup imported",
        `${result.entryCount} entries are now available. ${result.customTagCount} custom tags are saved.`
      );
    } catch (error) {
      Alert.alert(
        "Import failed",
        error instanceof Error
          ? error.message
          : "The backup could not be imported. Check the JSON and try again."
      );
    }
  };

  const handleImport = (mode: "merge" | "replace") => {
    if (mode === "merge") {
      void runImport("merge");
      return;
    }

    Alert.alert(
      "Restore and replace current data?",
      "This will replace the entries and settings currently stored on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore backup",
          style: "destructive",
          onPress: () => {
            void runImport("replace");
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear all data?",
      "This will remove your mood entries and saved settings from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await cancelDailyMoodReminderAsync();
            await moodStorage.clearAll();
            await resetSettings();
            await refreshEntries();
          },
        },
      ]
    );
  };

  return {
    entriesCount: entries.length,
    isLoading,
    settings,
    tagDraft,
    setTagDraft,
    timeDraft,
    setTimeDraft,
    summaryRange,
    setSummaryRange,
    summaryPreview,
    reminderSummary,
    handleAddTag,
    handleRemoveTag,
    handleReminderToggle,
    handleApplyReminderTime,
    handleToggleWeekday,
    handleSkipIfLoggedToggle,
    handleExport,
    handleShareSummary,
    handleCopySummary,
    handleImport,
    handleClearAll,
  };
}
