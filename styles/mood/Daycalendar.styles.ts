import { colors, spacing } from "@/styles";
import { StyleSheet } from "react-native";

export const dayCalendarStyles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },

  scroll: {
    flex: 1,
    width: "100%",
  },

  scrollContent: {
    paddingBottom: spacing.xl,
    alignItems: "center",
    gap: 14,
  },

  dateText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },

  bigEmoji: {
    fontSize: 72,
  },

  bigEmojiCompact: {
    fontSize: 60,
  },

  subtitle: {
    fontSize: 14,
    color: colors.mutedText,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },

  pickerWrap: {
    width: "100%",
    paddingHorizontal: spacing.md,
    marginTop: 6,
  },

  pickerCard: {
    width: "100%",
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },

  changeBtn: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#AFC2FF",
  },

  changeBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F2937",
  },

  streakText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F59E0B",
  },

  sameMoodStreakText: {
    fontSize: 13,
    fontWeight: "800",
    opacity: 0.9,
  },

  section: {
    marginTop: 14,
    width: "100%",
  },

  sectionCompact: {
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    opacity: 0.6,
    textAlign: "center",
  },

  sectionHint: {
    marginTop: 4,
    fontSize: 12,
    color: colors.mutedText,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },

  contextWrap: {
    marginTop: 8,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  contextProgressRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  contextStepChip: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D6E0FF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 2,
  },

  contextStepChipDone: {
    backgroundColor: "#F7FBF4",
    borderColor: "#CFE8C8",
  },

  contextStepChipActive: {
    backgroundColor: "#EEF4FF",
    borderColor: "#AFC2FF",
  },

  contextStepLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },

  contextStepLabelActive: {
    color: "#1D4ED8",
  },

  contextStepValue: {
    fontSize: 11,
    color: colors.mutedText,
    textAlign: "center",
  },

  contextStepValueActive: {
    color: "#4C6EA9",
  },

  contextCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DBE3F4",
    backgroundColor: "#F8FAFF",
    padding: 12,
    gap: 8,
  },

  contextCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },

  contextTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  contextTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },

  contextValue: {
    fontSize: 12,
    color: colors.mutedText,
  },

  contextClear: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.mutedText,
  },

  contextScaleRow: {
    flexDirection: "row",
    gap: 8,
  },

  contextScaleStep: {
    flex: 1,
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D6E0FF",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  contextScaleStepSelected: {
    transform: [{ scale: 1.03 }],
  },

  contextScaleStepText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
  },

  contextScaleStepTextActive: {
    color: "#FFFFFF",
  },

  contextScaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  contextScaleLabel: {
    fontSize: 12,
    color: colors.mutedText,
  },

  contextCompletionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CFE8C8",
    backgroundColor: "#F7FBF4",
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 6,
  },

  contextCompletionCardCelebrate: {
    borderColor: "#9AD08B",
    shadowColor: "#9AD08B",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  contextCompletionBadge: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: "#2F6F34",
  },

  contextCompletionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#16351A",
    textAlign: "center",
  },

  contextCompletionButton: {
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#B8D8B1",
  },

  contextCompletionButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#234D27",
  },

  tagsWrap: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: spacing.md,
  },

  tagsScroll: {
    marginTop: 10,
  },

  tagsScrollContent: {
    paddingHorizontal: spacing.md,
    gap: 10,
  },

  tagChip: {
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  tagChipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },

  tagChipInactive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#CBD5E1",
  },

  tagTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },

  tagTextInactive: {
    color: "#111827",
    fontWeight: "800",
    fontSize: 12,
  },

  customTagComposer: {
    marginTop: 10,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  customTagInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    fontSize: 14,
  },

  customTagButton: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: "#111827",
  },

  customTagButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
  },

  dateSubText: {
    fontSize: 12,
    opacity: 0.55,
    marginTop: -6,
  },
});
