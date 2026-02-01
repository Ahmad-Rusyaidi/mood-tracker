import { colors, spacing } from "@/styles";
import { StyleSheet } from "react-native";

export const dayCalendarStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
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

  tagsWrap: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
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
});
