import { dayCalendarStyles as styles } from "@/styles/mood/Daycalendar.styles";
import React from "react";
import { Pressable, Text } from "react-native";

type Props = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export function TagChip({ label, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tagChip,
        active ? styles.tagChipActive : styles.tagChipInactive,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Toggle tag ${label}`}
    >
      <Text style={active ? styles.tagTextActive : styles.tagTextInactive}>
        #{label}
      </Text>
    </Pressable>
  );
}
