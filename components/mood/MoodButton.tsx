import { colors, radius, spacing } from "@/styles";
import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

type Props = {
  emoji: string;
  label: string;
  isSelected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
};

export function MoodButton({ emoji, label, isSelected, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.btn,
        isSelected ? styles.btnSelected : styles.btnNormal,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Mood: ${label}`}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 64,
  },
  btnNormal: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  btnSelected: {
    backgroundColor: "#F3F4F6",
    borderColor: "#9CA3AF",
  },
  emoji: { fontSize: 26, marginBottom: 4 },
  label: { fontSize: 12, color: colors.mutedText },
});
