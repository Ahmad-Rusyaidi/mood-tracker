import { colors, spacing, typography } from "@/styles";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },

  // Toggle wrapper + sliding indicator
  toggleWrapper: {
    position: "relative",
    marginBottom: 12,
  },

  toggleIndicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
    backgroundColor: colors.primary ?? "#C9D7FF",
    borderWidth: 1,
    borderColor: "#AFC2FF",
  },

  // Toggle pills row
  toggleRow: {
    flexDirection: "row",
    gap: 10,
  },

  togglePill: {
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Active pill becomes transparent so indicator shows through
  togglePillActive: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },

  togglePillInactive: {
    backgroundColor: colors.card ?? "#FFFFFF",
    borderColor: colors.border,
  },

  toggleText: {
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.3,
    textAlign: "center",
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
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 10,
  },

  filterBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 10,
  },

  filterToggle: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#AFC2FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  filterToggleText: {
    fontWeight: "900",
    color: colors.text,
  },

  filterCountBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },

  filterCountBadgeText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
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
});
