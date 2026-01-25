import { spacing } from "@/styles";
import type { Mood } from "@/types";
import React from "react";
import { StyleSheet, View } from "react-native";
import { MoodButton } from "./MoodButton";

const MOOD_UI: Array<{ mood: Mood; emoji: string; label: string }> = [
  { mood: "happy", emoji: "😄", label: "Happy" },
  { mood: "sad", emoji: "😢", label: "Sad" },
  { mood: "angry", emoji: "😠", label: "Angry" },
  { mood: "neutral", emoji: "😐", label: "OK" },
  { mood: "anxious", emoji: "😰", label: "Anxious" },
];

type Props = {
  value: Mood | null;
  onChange: (m: Mood) => void;
};

export function MoodPicker({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {MOOD_UI.map((m) => (
        <MoodButton
          key={m.mood}
          emoji={m.emoji}
          label={m.label}
          isSelected={value === m.mood}
          onPress={() => onChange(m.mood)}
          style={styles.item}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  item: {
    flexGrow: 1,
  },
});
