import { styles } from "@/styles/settings.styles";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { Section } from "./SettingsPrimitives";

export function DataSection({
  isLoading,
  onClearAll,
}: {
  isLoading: boolean;
  onClearAll: () => void;
}) {
  return (
    <Section
      title="Data"
      subtitle="Keep your data easy to reset if you want a fresh start."
    >
      <View style={styles.card}>
        <Pressable onPress={onClearAll} style={styles.dangerButton}>
          <Text style={styles.dangerButtonText}>Clear all data</Text>
        </Pressable>

        <Text style={styles.helperText}>
          {isLoading
            ? "Loading saved settings..."
            : "Entries and preferences stay on this device unless you export them."}
        </Text>
      </View>
    </Section>
  );
}
