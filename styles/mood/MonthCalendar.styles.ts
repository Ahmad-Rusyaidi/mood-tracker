import { colors, radius, spacing } from "@/styles";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    wrap: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        padding: spacing.lg,
        backgroundColor: colors.card ?? colors.background,
        alignSelf: "center",

        // iOS shadow
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        // Android shadow
        elevation: 4,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },

    navBtn: {
        width: 42,
        height: 38,
        borderRadius: 14,
        backgroundColor: "#F1F5FF",
        alignItems: "center",
        justifyContent: "center",
    },
    navText: { fontSize: 22, color: colors.text },

    monthText: {
        fontSize: 16,
        fontWeight: "800",
        color: colors.text,
    },

    dowRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.md,
        paddingHorizontal: 2,
    },
    dowText: {
        textAlign: "center",
        color: colors.mutedText,
        fontSize: 12,
        fontWeight: "700",
    },

    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
    },

    dayCell: {
        borderRadius: 16,
        backgroundColor: "#F4F6FF", // pastel tile
        alignItems: "center",
        justifyContent: "center",
    },

    daySelected: {
        backgroundColor: colors.primary ?? "#C9D7FF",
        borderWidth: 1,
        borderColor: "#AFC2FF",
    },

    dayText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: "800",
    },
    dayTextSelected: {
        color: colors.text,
    },

    dot: {
        marginTop: 6,
        width: 7,
        height: 7,
        borderRadius: 999,
        backgroundColor: "#111827",
    },
    dotPlaceholder: {
        marginTop: 6,
        width: 7,
        height: 7,
        borderRadius: 999,
        backgroundColor: "transparent",
    },
    moodEmoji: {
        marginTop: 4,
        fontSize: 18, // tweak based on your cell size
    },

});
