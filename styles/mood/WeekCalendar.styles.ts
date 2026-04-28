import { colors, spacing } from "@/styles";
import { StyleSheet } from "react-native";

export const weekCalendarStyles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 10,
  },

  navRow: {
    flexDirection: "row",
    gap: 6,
  },

  navButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D6E0FF",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
  },

  navButtonToday: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },

  navButtonMuted: {
    backgroundColor: "#F8FAFF",
    borderColor: "#E5E7EB",
  },

  navButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1F2937",
  },

  navButtonTextToday: {
    color: "#FFFFFF",
  },

  navButtonTextMuted: {
    color: colors.mutedText,
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },

  dayCard: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F4F6FF",
  },

  dayCardSelected: {
    backgroundColor: "#C9D7FF",
  },

  dayLabel: {
    fontSize: 11,
    opacity: 0.7,
  },

  dayNumber: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
    color: colors.text,
  },

  dayEmoji: {
    fontSize: 16,
    marginTop: 2,
  },

  summaryStack: {
    gap: 8,
  },

  headlineCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#F4D8B3",
    gap: 6,
  },

  headlineEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: "#B45309",
  },

  headlineText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
    color: "#7C2D12",
  },

  headlineSubtext: {
    fontSize: 12,
    lineHeight: 17,
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

  warningStack: {
    gap: 8,
  },

  warningCard: {
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#F6D8AD",
    gap: 4,
  },

  warningCardPressable: {
    borderColor: "#F0C98E",
  },

  warningLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: "#B45309",
  },

  warningTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: "#7C2D12",
  },

  warningDetail: {
    fontSize: 12,
    lineHeight: 17,
    color: "#9A5A23",
  },

  warningLinkPill: {
    alignSelf: "flex-start",
    marginTop: 1,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.78)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  warningLinkText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9A3412",
  },

  reflectionCard: {
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 13,
    backgroundColor: "#F7F8FC",
    borderWidth: 1,
    borderColor: "#DFE4F1",
    gap: 4,
  },

  reflectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: "#55627B",
  },

  reflectionText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: "#1F2937",
  },

  rangeText: {
    fontSize: 11,
    color: colors.mutedText,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
});
