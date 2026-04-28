import { styles } from "@/styles/settings.styles";
import React from "react";
import { Pressable, Text, View } from "react-native";

export function Section({
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

export function PillButton({
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
      style={[
        styles.pillButton,
        active ? styles.pillButtonActive : styles.pillButtonInactive,
      ]}
    >
      <Text
        style={[
          styles.pillButtonText,
          active ? styles.pillButtonTextActive : styles.pillButtonTextInactive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
