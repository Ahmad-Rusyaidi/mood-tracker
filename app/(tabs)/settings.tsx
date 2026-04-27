import { useAppSettings, useMoodEntries } from "@/hooks";
import { DEFAULT_TAGS } from "@/constants/tags";
import { appSettingsStorage, moodStorage } from "@/storage";
import { colors, radius, spacing, typography } from "@/styles";
import {
  cancelDailyMoodReminderAsync,
  scheduleDailyMoodReminderAsync,
} from "@/utils/reminders";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const REMINDER_TIMES = ["18:00", "20:00", "22:00"] as const;

function formatReminderTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours ?? 20, minutes ?? 0, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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
  const { refresh } = useMoodEntries();
  const {
    settings,
    isLoading,
    addCustomTag,
    removeCustomTag,
    setReminderEnabled,
    setReminderTime,
    resetSettings,
  } = useAppSettings();
  const [tagDraft, setTagDraft] = useState("");

  const handleAddTag = async () => {
    const next = tagDraft.trim().toLowerCase();
    if (!next) return;
    await addCustomTag(next);
    setTagDraft("");
  };

  const handleReminderToggle = async (enabled: boolean) => {
    if (!enabled) {
      await cancelDailyMoodReminderAsync();
      await setReminderEnabled(false);
      return;
    }

    const scheduled = await scheduleDailyMoodReminderAsync(settings.reminders.time);
    if (!scheduled) {
      Alert.alert(
        "Notifications not allowed",
        "Enable notifications for this app to receive daily check-in reminders."
      );
      await setReminderEnabled(false);
      return;
    }

    await setReminderEnabled(true);
  };

  const handleReminderTimeChange = async (time: string) => {
    await setReminderTime(time);

    if (settings.reminders.enabled) {
      const scheduled = await scheduleDailyMoodReminderAsync(time);
      if (!scheduled) {
        await setReminderEnabled(false);
      }
    }
  };

  const handleExport = async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      entries: await moodStorage.getAll(),
      settings: await appSettingsStorage.getAll(),
    };

    await Share.share({
      message: JSON.stringify(payload, null, 2),
      title: "Mood tracker export",
    });
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
            await refresh();
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
            Manage your custom tags, reminders, and data preferences in one place.
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
                  <Pressable key={tag} onPress={() => void removeCustomTag(tag)} style={styles.removableTag}>
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

        <Section title="Reminder preferences" subtitle="Use a daily nudge to keep the check-in habit steady.">
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={styles.switchTitle}>Daily check-in reminder</Text>
                <Text style={styles.switchSubtitle}>
                  {settings.reminders.enabled
                    ? `Scheduled for ${formatReminderTime(settings.reminders.time)}`
                    : "Turn this on to schedule a daily prompt on this device."}
                </Text>
              </View>

              <Switch
                value={settings.reminders.enabled}
                onValueChange={(value) => void handleReminderToggle(value)}
                trackColor={{ false: "#D1D5DB", true: "#AFC2FF" }}
                thumbColor={settings.reminders.enabled ? "#111827" : "#F9FAFB"}
              />
            </View>

            <View style={styles.timeRow}>
              {REMINDER_TIMES.map((time) => (
                <PillButton
                  key={time}
                  label={formatReminderTime(time)}
                  active={settings.reminders.time === time}
                  onPress={() => void handleReminderTimeChange(time)}
                />
              ))}
            </View>
          </View>
        </Section>

        <Section title="Data" subtitle="Keep your data portable and easy to reset if you need a fresh start.">
          <View style={styles.card}>
            <Pressable onPress={() => void handleExport()} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Export data</Text>
            </Pressable>

            <Pressable onPress={handleClearAll} style={styles.dangerButton}>
              <Text style={styles.dangerButtonText}>Clear all data</Text>
            </Pressable>

            <Text style={styles.helperText}>
              {isLoading ? "Loading saved settings..." : "Entries and preferences stay on this device unless you export them."}
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
  dangerButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#991B1B",
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
