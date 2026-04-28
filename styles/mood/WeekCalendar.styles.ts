import { colors, spacing } from "@/styles";
import { StyleSheet } from "react-native";

export const weekCalendarStyles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 14,
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  dayCard: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#F4F6FF",
  },

  dayCardSelected: {
    backgroundColor: "#C9D7FF",
  },

  dayLabel: {
    fontSize: 12,
    opacity: 0.7,
  },

  dayNumber: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 6,
    color: colors.text,
  },

  dayEmoji: {
    fontSize: 18,
    marginTop: 4,
  },

  summaryStack: {
    gap: 10,
  },

  headlineCard: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#F4D8B3",
    gap: 8,
  },

  headlineEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: "#B45309",
  },

  headlineText: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    color: "#7C2D12",
  },

  headlineSubtext: {
    fontSize: 13,
    lineHeight: 19,
    color: "#9A5A23",
  },

  statsRow: {
    flexDirection: "row",
  },

  statCard: {
    width: "100%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    backgroundColor: "#F8FAFF",
    borderColor: "#D9E4F7",
    gap: 6,
  },

  statCardCelebrate: {
    backgroundColor: "#F6FBF4",
    borderColor: "#CFE8C8",
  },

  statLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: colors.mutedText,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },

  statHelper: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.mutedText,
  },

  reflectionCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F7F8FC",
    borderWidth: 1,
    borderColor: "#DFE4F1",
    gap: 6,
  },

  reflectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: "#55627B",
  },

  reflectionText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: "#1F2937",
  },

  rangeText: {
    fontSize: 12,
    color: colors.mutedText,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
});
