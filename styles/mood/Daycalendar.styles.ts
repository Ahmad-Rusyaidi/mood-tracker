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

  subtitle: {
    fontSize: 14,
    color: colors.mutedText,
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
    backgroundColor: colors.card ?? "#FFFFFF",
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

  /* 🔥 NEW BELOW */

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

  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    opacity: 0.6,
    textAlign: "center",
  },

  sectionHint: {
    marginTop: 6,
    fontSize: 12,
    color: colors.mutedText,
    textAlign: "center",
  },

  contextWrap: {
    marginTop: 10,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  contextCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DBE3F4",
    backgroundColor: "#F8FAFF",
    padding: 12,
    gap: 10,
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
    fontSize: 14,
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
    minHeight: 38,
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

  tagsWrap: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },

  customTagComposer: {
    marginTop: 12,
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

  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
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
    color: "white",
    fontWeight: "800",
    fontSize: 12,
  },

  tagTextInactive: {
    color: "#111827",
    fontWeight: "800",
    fontSize: 12,
  },

  noteWrap: {
    marginTop: 10,
    paddingHorizontal: spacing.md,
  },

  noteInput: {
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    fontSize: 14,
  },

  autosaveText: {
    marginTop: 6,
    fontSize: 11,
    opacity: 0.5,
    textAlign: "right",
  },

  dateSubText: {
    fontSize: 12,
    opacity: 0.55,
    marginTop: -6,
  },

});
