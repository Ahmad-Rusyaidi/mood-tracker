import { DEFAULT_TAGS } from "@/constants/tags";
import { useAppSettings, useMoodEntries } from "@/hooks";
import { moodStorage } from "@/storage";
import { colors, radius, spacing, typography } from "@/styles";
import type { ReminderWeekday } from "@/types";
import {
  buildBackupFilename,
  exportBackupPayloadAsync,
  importBackupPayloadAsync,
} from "@/utils/backup";
import {
  REMINDER_WEEKDAY_OPTIONS,
  cancelDailyMoodReminderAsync,
  syncMoodReminderScheduleAsync,
} from "@/utils/reminders";
import { formatReminderTime, normalizeReminderTime } from "@/utils/reminderTime";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const REMINDER_PRESET_TIMES = ["18:00", "20:00", "22:00"] as const;

function formatSelectedWeekdays(weekdays: ReminderWeekday[]) {
  if (weekdays.length === REMINDER_WEEKDAY_OPTIONS.length) {
    return "Every day";
  }

  const weekdayKey = [1, 2, 3, 4, 5];
  if (
    weekdays.length === weekdayKey.length &&
    weekdayKey.every((day) => weekdays.includes(day as ReminderWeekday))
  ) {
    return "Weekdays";
  }

  return REMINDER_WEEKDAY_OPTIONS.filter((option) => weekdays.includes(option.value))
    .map((option) => option.shortLabel)
    .join(", ");
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function PillButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pillButton, active ? styles.pillButtonActive : styles.pillButtonInactive]}
    >
      <Text style={[styles.pillButtonText, active ? styles.pillButtonTextActive : styles.pillButtonTextInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { refresh: refreshEntries } = useMoodEntries();
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

  useEffect(() => {
    setTimeDraft(settings.reminders.time);
  }, [settings.reminders.time]);

  const reminderSummary = useMemo(() => {
    const daySummary = formatSelectedWeekdays(settings.reminders.weekdays);
    const timeSummary = formatReminderTime(settings.reminders.time);
    const skipSummary = settings.reminders.skipIfLogged ? "skips days you already logged" : "always sends";
    return `${daySummary} at ${timeSummary}, ${skipSummary}.`;
  }, [settings.reminders]);

  const handleAddTag = async () => {
    const next = tagDraft.trim().toLowerCase();
    if (!next) return;
    await addCustomTag(next);
    setTagDraft("");
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Manage your custom tags, reminders, backups, and data preferences in one place.
          </Text>
        </View>

        <Section
          title="Tag management"
          subtitle="Default tags are always available. Custom tags are saved and can be reused on any day."
        >
          <View style={styles.card}>
            <View style={styles.tagGroup}>
              <Text style={styles.groupTitle}>Default tags</Text>
              <View style={styles.tagWrap}>
                {DEFAULT_TAGS.map((tag) => (
                  <View key={tag} style={styles.defaultTag}>
                    <Text style={styles.defaultTagText}>{`#${tag}`}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.tagGroup}>
              <Text style={styles.groupTitle}>Saved custom tags</Text>

              <View style={styles.composerRow}>
                <TextInput
                  value={tagDraft}
                  onChangeText={setTagDraft}
                  placeholder="Create a custom tag"
                  placeholderTextColor="rgba(17,24,39,0.35)"
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={() => void handleAddTag()}
                />
                <Pressable onPress={() => void handleAddTag()} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Add</Text>
                </Pressable>
              </View>

              <View style={styles.tagWrap}>
                {settings.customTags.length > 0 ? (
                  settings.customTags.map((tag) => (
                    <Pressable
                      key={tag}
                      onPress={() => void removeCustomTag(tag)}
                      style={styles.removableTag}
                    >
                      <Text style={styles.removableTagText}>{`#${tag}`}</Text>
                      <Text style={styles.removableTagX}>Remove</Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.emptyHint}>
                    No custom tags yet. Add a few here and they will appear in the daily mood screen.
                  </Text>
                )}
              </View>
            </View>
          </View>
        </Section>

        <Section
          title="Reminder preferences"
          subtitle="Set your own time, choose reminder days, and skip nudges after you already check in."
        >
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={styles.switchTitle}>Daily check-in reminder</Text>
                <Text style={styles.switchSubtitle}>
                  {settings.reminders.enabled
                    ? reminderSummary
                    : "Turn this on to schedule check-in prompts on this device."}
                </Text>
              </View>

              <Switch
                value={settings.reminders.enabled}
                onValueChange={(value) => void handleReminderToggle(value)}
                trackColor={{ false: "#D1D5DB", true: "#AFC2FF" }}
                thumbColor={settings.reminders.enabled ? "#111827" : "#F9FAFB"}
              />
            </View>

            <View style={styles.inputRow}>
              <TextInput
                value={timeDraft}
                onChangeText={setTimeDraft}
                onBlur={() => void handleApplyReminderTime()}
                placeholder="20:00"
                placeholderTextColor="rgba(17,24,39,0.35)"
                style={styles.timeInput}
                keyboardType="numbers-and-punctuation"
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={() => void handleApplyReminderTime()}
              />

              <Pressable onPress={() => void handleApplyReminderTime()} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Apply time</Text>
              </Pressable>
            </View>

            <View style={styles.timeRow}>
              {REMINDER_PRESET_TIMES.map((time) => (
                <PillButton
                  key={time}
                  label={formatReminderTime(time)}
                  active={settings.reminders.time === time}
                  onPress={() => {
                    setTimeDraft(time);
                    void handleApplyReminderTime(time);
                  }}
                />
              ))}
            </View>

            <View style={styles.tagGroup}>
              <Text style={styles.groupTitle}>Reminder days</Text>
              <View style={styles.timeRow}>
                {REMINDER_WEEKDAY_OPTIONS.map((option) => (
                  <PillButton
                    key={option.value}
                    label={option.shortLabel}
                    active={settings.reminders.weekdays.includes(option.value)}
                    onPress={() => void handleToggleWeekday(option.value)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={styles.switchTitle}>Skip reminder if already logged today</Text>
                <Text style={styles.switchSubtitle}>
                  Helps avoid extra nudges after you have already checked in.
                </Text>
              </View>

              <Switch
                value={settings.reminders.skipIfLogged}
                onValueChange={(value) => void handleSkipIfLoggedToggle(value)}
                trackColor={{ false: "#D1D5DB", true: "#AFC2FF" }}
                thumbColor={settings.reminders.skipIfLogged ? "#111827" : "#F9FAFB"}
              />
            </View>

            <Text style={styles.helperText}>
              Use `HH:MM` in 24-hour time. Reminder notifications still include quick mood actions for a fast check-in.
            </Text>
          </View>
        </Section>

        <Section
          title="Backup and restore"
          subtitle="Export your data as a backup file, then import that file later to merge or fully restore."
        >
          <View style={styles.card}>
            <Pressable onPress={() => void handleExport()} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Export backup file</Text>
            </Pressable>

            <View style={styles.backupInfoCard}>
              <Text style={styles.backupInfoTitle}>How it works</Text>
              <Text style={styles.backupInfoBody}>
                Export creates a `.json` backup file and opens the share sheet. Import and restore
                will open a file picker so you can choose that backup file later.
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <Pressable onPress={() => handleImport("merge")} style={styles.secondaryButtonCompact}>
                <Text style={styles.secondaryButtonText}>Import file and merge</Text>
              </Pressable>

              <Pressable onPress={() => handleImport("replace")} style={styles.dangerButtonCompact}>
                <Text style={styles.dangerButtonText}>Restore from file</Text>
              </Pressable>
            </View>

            <Text style={styles.helperText}>
              `Import file and merge` keeps your current reminder preferences and merges entries by
              date. `Restore from file` replaces current entries and settings.
            </Text>
          </View>
        </Section>

        <Section title="Data" subtitle="Keep your data easy to reset if you want a fresh start.">
          <View style={styles.card}>
            <Pressable onPress={handleClearAll} style={styles.dangerButton}>
              <Text style={styles.dangerButtonText}>Clear all data</Text>
            </Pressable>

            <Text style={styles.helperText}>
              {isLoading
                ? "Loading saved settings..."
                : "Entries and preferences stay on this device unless you export them."}
            </Text>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  hero: {
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedText,
    lineHeight: 22,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.mutedText,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  tagGroup: {
    gap: spacing.sm,
  },
  groupTitle: {
    ...typography.caption,
    color: colors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFF",
    paddingHorizontal: 14,
    fontSize: 14,
  },
  timeInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFF",
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
  },
  primaryButton: {
    borderRadius: 999,
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  removableTag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D6E0FF",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
  },
  defaultTag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  defaultTagText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  removableTagText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  removableTagX: {
    fontSize: 11,
    color: colors.mutedText,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  switchTextWrap: {
    flex: 1,
    gap: 4,
  },
  switchTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  switchSubtitle: {
    ...typography.caption,
    color: colors.mutedText,
    lineHeight: 18,
  },
  timeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pillButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillButtonActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  pillButtonInactive: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  pillButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  pillButtonTextActive: {
    color: "#FFFFFF",
  },
  pillButtonTextInactive: {
    color: colors.text,
  },
  secondaryButton: {
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#D6E0FF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonCompact: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#D6E0FF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  dangerButton: {
    borderRadius: 999,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerButtonCompact: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#991B1B",
  },
  backupInfoCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCE5FA",
    backgroundColor: "#F9FBFF",
    padding: spacing.md,
    gap: spacing.xs,
  },
  backupInfoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  backupInfoBody: {
    ...typography.body,
    color: colors.mutedText,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  helperText: {
    ...typography.caption,
    color: colors.mutedText,
    lineHeight: 18,
  },
  emptyHint: {
    ...typography.body,
    color: colors.mutedText,
    lineHeight: 22,
  },
});
