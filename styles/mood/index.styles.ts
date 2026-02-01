import { colors, spacing, typography } from "@/styles";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },

  // Toggle pills
  toggleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  togglePill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  togglePillActive: {
    backgroundColor: colors.primary ?? "#C9D7FF",
    borderColor: "#AFC2FF",
  },
  togglePillInactive: {
    backgroundColor: colors.card ?? "#FFFFFF",
    borderColor: colors.border,
  },
  toggleText: {
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  toggleTextActive: {
    color: colors.text,
  },
  toggleTextInactive: {
    color: colors.text,
  },

  // Calendar area
  calendarArea: {
    flex: 1,
    justifyContent: "center",
  },

  // Bottom section
  bottom: {
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  hint: {
    ...typography.caption,
    color: colors.mutedText,
  },

  // Summary (day/week when saved)
  summary: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
  },
  bigEmoji: {
    fontSize: 72,
  },
  savedText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.mutedText,
  },
  changeLink: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
  },
});
