import type { MoodEntry } from "@/types";
import { moodToEmoji } from "@/utils/moodUi";
import React from "react";
import { Text, View } from "react-native";

type Props = {
  selectedDate: string;
  entry: MoodEntry | null;
};

export function DayCalendar({ selectedDate, entry }: Props) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 24 }}>
      <Text style={{ fontSize: 16, fontWeight: "700" }}>{selectedDate}</Text>

      <Text style={{ fontSize: 64, marginTop: 10 }}>
        {entry ? moodToEmoji[entry.mood] : "🙂"}
      </Text>

      <Text style={{ marginTop: 8, opacity: 0.6 }}>
        {entry ? `Saved: ${entry.mood}` : "No mood saved"}
      </Text>
    </View>
  );
}
