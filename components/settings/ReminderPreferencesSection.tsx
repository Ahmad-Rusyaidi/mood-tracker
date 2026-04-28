import { styles } from "@/styles/settings.styles";
import type { ReminderWeekday } from "@/types";
import { REMINDER_WEEKDAY_OPTIONS } from "@/utils/reminders";
import { formatReminderTime } from "@/utils/reminderTime";
import { REMINDER_PRESET_TIMES } from "@/utils/settings";
import React from "react";
import { Pressable, Switch, Text, TextInput, View } from "react-native";
import { PillButton, Section } from "./SettingsPrimitives";

export function ReminderPreferencesSection({
  enabled,
  reminderSummary,
  timeDraft,
  selectedTime,
  selectedWeekdays,
  skipIfLogged,
  onToggleReminder,
  onChangeTimeDraft,
  onApplyReminderTime,
  onToggleWeekday,
  onToggleSkipIfLogged,
}: {
  enabled: boolean;
  reminderSummary: string;
  timeDraft: string;
  selectedTime: string;
  selectedWeekdays: ReminderWeekday[];
  skipIfLogged: boolean;
  onToggleReminder: (enabled: boolean) => void;
  onChangeTimeDraft: (value: string) => void;
  onApplyReminderTime: (nextValue?: string) => void;
  onToggleWeekday: (day: ReminderWeekday) => void;
  onToggleSkipIfLogged: (skipIfLogged: boolean) => void;
}) {
  return (
    <Section
      title="Reminder preferences"
      subtitle="Set your own time, choose reminder days, and skip nudges after you already check in."
    >
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.switchTitle}>Daily check-in reminder</Text>
            <Text style={styles.switchSubtitle}>
              {enabled
                ? reminderSummary
                : "Turn this on to schedule check-in prompts on this device."}
            </Text>
          </View>

          <Switch
            value={enabled}
            onValueChange={onToggleReminder}
            trackColor={{ false: "#D1D5DB", true: "#AFC2FF" }}
            thumbColor={enabled ? "#111827" : "#F9FAFB"}
          />
        </View>

        <View style={styles.inputRow}>
          <TextInput
            value={timeDraft}
            onChangeText={onChangeTimeDraft}
            onBlur={() => onApplyReminderTime()}
            placeholder="20:00"
            placeholderTextColor="rgba(17,24,39,0.35)"
            style={styles.timeInput}
            keyboardType="numbers-and-punctuation"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={() => onApplyReminderTime()}
          />

          <Pressable onPress={() => onApplyReminderTime()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Apply time</Text>
          </Pressable>
        </View>

        <View style={styles.timeRow}>
          {REMINDER_PRESET_TIMES.map((time) => (
            <PillButton
              key={time}
              label={formatReminderTime(time)}
              active={selectedTime === time}
              onPress={() => {
                onChangeTimeDraft(time);
                onApplyReminderTime(time);
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
                active={selectedWeekdays.includes(option.value)}
                onPress={() => onToggleWeekday(option.value)}
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
            value={skipIfLogged}
            onValueChange={onToggleSkipIfLogged}
            trackColor={{ false: "#D1D5DB", true: "#AFC2FF" }}
            thumbColor={skipIfLogged ? "#111827" : "#F9FAFB"}
          />
        </View>

        <Text style={styles.helperText}>
          Use `HH:MM` in 24-hour time. Reminder notifications still include quick mood actions for a fast check-in.
        </Text>
      </View>
    </Section>
  );
}
