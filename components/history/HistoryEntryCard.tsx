import { styles } from "@/styles/history.styles";
import type { MoodEntry } from "@/types";
import type { EntryHighlight } from "@/utils/history";
import { getContextPreview, formatEntryDate, truncate } from "@/utils/history";
import { moodToEmoji } from "@/utils/moodUi";
import React from "react";
import { Pressable, Text, View } from "react-native";

export function HistoryEntryCard({
  entry,
  highlight,
  onEdit,
  onDelete,
}: {
  entry: MoodEntry;
  highlight?: EntryHighlight | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const tags = entry.tags?.length
    ? entry.tags.map((tag) => `#${tag}`).join(" ")
    : "No tags";
  const contextPreview = truncate(getContextPreview(entry), 120);

  return (
    <View
      style={[
        styles.entryCard,
        highlight?.tone === "supportive" ? styles.entryCardSupportive : null,
        highlight?.tone === "challenging" ? styles.entryCardChallenging : null,
      ]}
    >
      <View style={styles.entryTopRow}>
        <View style={styles.entryDateWrap}>
          <Text style={styles.entryDate}>{formatEntryDate(entry.date)}</Text>
          <Text style={styles.entryMeta}>Open or remove this day</Text>
        </View>

        <View style={styles.entryMoodBadge}>
          <Text style={styles.entryMoodEmoji}>{moodToEmoji[entry.mood]}</Text>
          <Text style={styles.entryMoodLabel}>{entry.mood}</Text>
        </View>
      </View>

      {highlight ? (
        <View
          style={[
            styles.entryHighlightPill,
            highlight.tone === "supportive" ? styles.entryHighlightPillSupportive : null,
            highlight.tone === "challenging" ? styles.entryHighlightPillChallenging : null,
          ]}
        >
          <Text style={styles.entryHighlightLabel}>{highlight.label}</Text>
          <Text style={styles.entryHighlightDetail}>{highlight.detail}</Text>
        </View>
      ) : null}

      <Text style={styles.entryTags}>{tags}</Text>
      <Text style={styles.entryContext}>{contextPreview}</Text>

      <View style={styles.entryActionsRow}>
        <Pressable onPress={onEdit} style={styles.entryActionPrimary}>
          <Text style={styles.entryActionPrimaryText}>Edit day</Text>
        </Pressable>

        <Pressable onPress={onDelete} style={styles.entryActionDanger}>
          <Text style={styles.entryActionDangerText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}
