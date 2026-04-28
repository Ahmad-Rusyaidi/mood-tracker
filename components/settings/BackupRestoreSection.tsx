import { styles } from "@/styles/settings.styles";
import type { SummaryRange } from "@/utils/shareSummary";
import { SUMMARY_RANGE_OPTIONS } from "@/utils/settings";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { PillButton, Section } from "./SettingsPrimitives";

export function BackupRestoreSection({
  hasEntries,
  summaryPreview,
  summaryRange,
  onChangeSummaryRange,
  onExport,
  onShareSummary,
  onCopySummary,
  onImport,
}: {
  hasEntries: boolean;
  summaryPreview: string;
  summaryRange: SummaryRange;
  onChangeSummaryRange: (value: SummaryRange) => void;
  onExport: () => void;
  onShareSummary: () => void;
  onCopySummary: () => void;
  onImport: (mode: "merge" | "replace") => void;
}) {
  return (
    <Section
      title="Backup and restore"
      subtitle="Export a backup file, share a readable summary, or restore your data later."
    >
      <View style={styles.card}>
        <View style={styles.summaryPreviewCard}>
          <Text style={styles.summaryPreviewTitle}>Readable summary preview</Text>
          <Text style={styles.summaryPreviewBody}>
            {hasEntries
              ? summaryPreview
              : "Add a few check-ins first and your summary preview will appear here."}
          </Text>
        </View>

        <Pressable onPress={onExport} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Export backup file</Text>
        </Pressable>

        <View style={styles.tagGroup}>
          <Text style={styles.groupTitle}>Summary range</Text>
          <View style={styles.timeRow}>
            {SUMMARY_RANGE_OPTIONS.map((option) => (
              <PillButton
                key={option.value}
                label={option.label}
                active={summaryRange === option.value}
                onPress={() => onChangeSummaryRange(option.value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.buttonRow}>
          <Pressable onPress={onShareSummary} style={styles.secondaryButtonCompact}>
            <Text style={styles.secondaryButtonText}>Share readable summary</Text>
          </Pressable>

          <Pressable onPress={onCopySummary} style={styles.secondaryButtonCompact}>
            <Text style={styles.secondaryButtonText}>Copy summary</Text>
          </Pressable>
        </View>

        <View style={styles.backupInfoCard}>
          <Text style={styles.backupInfoTitle}>How it works</Text>
          <Text style={styles.backupInfoBody}>
            Export creates a `.json` backup file and opens the share sheet. Import and restore
            will open a file picker so you can choose that backup file later. Share readable
            summary creates a plain-language `.txt` recap instead.
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <Pressable onPress={() => onImport("merge")} style={styles.secondaryButtonCompact}>
            <Text style={styles.secondaryButtonText}>Import file and merge</Text>
          </Pressable>

          <Pressable onPress={() => onImport("replace")} style={styles.dangerButtonCompact}>
            <Text style={styles.dangerButtonText}>Restore from file</Text>
          </Pressable>
        </View>

        <Text style={styles.helperText}>
          `Import file and merge` keeps your current reminder preferences and merges entries by
          date. `Restore from file` replaces current entries and settings.
        </Text>
      </View>
    </Section>
  );
}
