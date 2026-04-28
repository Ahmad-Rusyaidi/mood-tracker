import { BackupRestoreSection } from "@/components/settings/BackupRestoreSection";
import { DataSection } from "@/components/settings/DataSection";
import { ReminderPreferencesSection } from "@/components/settings/ReminderPreferencesSection";
import { TagManagementSection } from "@/components/settings/TagManagementSection";
import { useSettingsScreen } from "@/hooks";
import { styles } from "@/styles/settings.styles";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const screen = useSettingsScreen();

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

        <TagManagementSection
          customTags={screen.settings.customTags}
          tagDraft={screen.tagDraft}
          onChangeTagDraft={screen.setTagDraft}
          onAddTag={() => void screen.handleAddTag()}
          onRemoveTag={(tag) => void screen.handleRemoveTag(tag)}
        />

        <ReminderPreferencesSection
          enabled={screen.settings.reminders.enabled}
          reminderSummary={screen.reminderSummary}
          timeDraft={screen.timeDraft}
          selectedTime={screen.settings.reminders.time}
          selectedWeekdays={screen.settings.reminders.weekdays}
          skipIfLogged={screen.settings.reminders.skipIfLogged}
          onToggleReminder={(value) => void screen.handleReminderToggle(value)}
          onChangeTimeDraft={screen.setTimeDraft}
          onApplyReminderTime={(value) => void screen.handleApplyReminderTime(value)}
          onToggleWeekday={(day) => void screen.handleToggleWeekday(day)}
          onToggleSkipIfLogged={(value) => void screen.handleSkipIfLoggedToggle(value)}
        />

        <BackupRestoreSection
          hasEntries={screen.entriesCount > 0}
          summaryPreview={screen.summaryPreview}
          summaryRange={screen.summaryRange}
          onChangeSummaryRange={screen.setSummaryRange}
          onExport={() => void screen.handleExport()}
          onShareSummary={() => void screen.handleShareSummary()}
          onCopySummary={() => void screen.handleCopySummary()}
          onImport={screen.handleImport}
        />

        <DataSection
          isLoading={screen.isLoading}
          onClearAll={screen.handleClearAll}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
