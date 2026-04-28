import { styles } from "@/styles/home.styles";
import type { ViewMode } from "@/utils/home";
import React from "react";
import { Animated, Pressable, Text, View } from "react-native";

export function HomeViewToggle({
  pillWidth,
  indicatorX,
  viewMode,
  onSelectViewMode,
}: {
  pillWidth: number;
  indicatorX: Animated.Value;
  viewMode: ViewMode;
  onSelectViewMode: (mode: ViewMode) => void;
}) {
  return (
    <View style={styles.toggleWrapper}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.toggleIndicator,
          { width: pillWidth, transform: [{ translateX: indicatorX }] },
        ]}
      />

      <View style={styles.toggleRow}>
        {(["day", "week", "month"] as const).map((mode) => {
          const active = viewMode === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => onSelectViewMode(mode)}
              style={[
                styles.togglePill,
                { width: pillWidth },
                active ? styles.togglePillActive : styles.togglePillInactive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  active ? styles.toggleTextActive : styles.toggleTextInactive,
                ]}
              >
                {mode.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
