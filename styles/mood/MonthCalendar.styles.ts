import { colors, radius, spacing } from "@/styles";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.card ?? colors.background,
    alignSelf: "stretch",

    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F5F7FF",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
  },

  monthText: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.2,
    color: colors.text,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginBottom: 14,
  },
  summaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F7F8FF",
    borderWidth: 1,
    borderColor: "#E6EBFA",
  },
  summaryPillText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },

  dowRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  dowText: {
    textAlign: "center",
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "800",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  dayBase: {
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  dayEmpty: {
    backgroundColor: "#F4F6FF",
  },

  dayWithMood: {
    backgroundColor: "transparent",
  },

  daySelected: {
    backgroundColor: colors.primary ?? "#C9D7FF",
    borderWidth: 1,
    borderColor: "#AFC2FF",
  },

  dayWithMoodSelected: {
    borderWidth: 2,
    borderColor: "#AFC2FF",
    backgroundColor: "transparent",
  },

  dayNum: {
    position: "absolute",
    top: 4,
    left: 0,
    width: "100%",
    textAlign: "center",
    color: colors.text,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
    opacity: 0.78,
  },
  dayNumSelected: {
    color: colors.text,
    opacity: 0.9,
  },

  moodEmojiBig: {
    fontSize: 24,
    marginTop: 10,
  },

  // ✅ NEW: dim non-matching days
  dayDim: {
    opacity: 0.25,
  },
});
