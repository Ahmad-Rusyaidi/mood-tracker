//src/utils/moodUi.ts
import type { Mood } from "@/types";

export const moodToEmoji: Record<Mood, string> = {
  happy: "😄",
  sad: "😢",
  angry: "😠",
  neutral: "😐",
  anxious: "😰",
};
