import type { Mood } from "@/types";

export const moodSparkleColors: Record<Mood, string[]> = {
  happy: [
    "#F59E0B", // amber
    "#FBBF24", // warm yellow
    "#FDE68A", // light gold
  ],

  sad: [
    "#3B82F6", // blue
    "#60A5FA", // sky blue
    "#93C5FD", // soft blue
  ],

  angry: [
    "#EF4444", // red
    "#F87171", // coral red
    "#FCA5A5", // soft red
  ],

  neutral: [
    "#6B7280", // gray
    "#9CA3AF", // mid gray
    "#D1D5DB", // light gray
  ],

  anxious: [
    "#8B5CF6", // purple
    "#A78BFA", // lavender
    "#C4B5FD", // soft purple
  ],
};
