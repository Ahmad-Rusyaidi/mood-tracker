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

  // Optional: pastel "card" behind picker (looks less bland)
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

});
