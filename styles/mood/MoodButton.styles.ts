import { colors, radius, spacing } from "@/styles";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  btn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 64,
  },
  btnNormal: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  btnSelected: {
    backgroundColor: "#F3F4F6",
    borderColor: "#9CA3AF",
  },
  emoji: { fontSize: 26, marginBottom: 4 },
  label: { fontSize: 12, color: colors.mutedText },
});
