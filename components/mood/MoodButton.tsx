import { styles } from "@/styles/mood/MoodButton.styles";
import React from "react";
import { Pressable, Text, ViewStyle } from "react-native";

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
