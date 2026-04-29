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
    marginBottom: 14,
    padding: 4,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#DCE5FA",
  },

  toggleIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 999,
    backgroundColor: "#CDD9FF",
    borderWidth: 1,
    borderColor: "#AFC2FF",
  },

  // Toggle pills row
  toggleRow: {
    flexDirection: "row",
    gap: 6,
  },

  togglePill: {
    paddingVertical: 11,
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
    backgroundColor: "transparent",
    borderColor: "transparent",
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
    alignItems: "stretch",
    paddingTop: 10,
  },

  filterBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 12,
  },

  filterToggle: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: "#F9FAFF",
    borderWidth: 1,
    borderColor: "#D9E3FA",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  filterToggleText: {
    fontWeight: "900",
    color: colors.text,
  },
  filterChevronBadge: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#E2E9FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: -2,
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
