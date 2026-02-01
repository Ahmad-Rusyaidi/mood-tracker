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

        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
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
        justifyContent: "center",
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

    /** Base cell */
    dayBase: {
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        position: "relative", // 👈 for day number top-left
    },

    /** Empty day keeps the tile */
    dayEmpty: {
        backgroundColor: "#F4F6FF",
    },

    /** Day with mood: NO tile background */
    dayWithMood: {
        backgroundColor: "transparent",
    },

    /** Selected empty day = your existing selected tile look */
    daySelected: {
        backgroundColor: colors.primary ?? "#C9D7FF",
        borderWidth: 1,
        borderColor: "#AFC2FF",
    },

    /** Selected mood day = ring only (no filled tile) */
    dayWithMoodSelected: {
        borderWidth: 2,
        borderColor: "#AFC2FF",
        backgroundColor: "transparent",
    },

    /** Day number pinned top-left */
    dayNum: {
        position: "absolute",
        top: 6,
        left: 7,
        color: colors.text,
        fontSize: 9,
        fontWeight: "700",
        opacity: 0.75,
    },
    dayNumSelected: {
        color: colors.text,
        opacity: 0.9,
    },

    /** Big emoji centered (whole emoji day) */
    moodEmojiBig: {
        fontSize: 28,
        marginTop: 12, // gives space so it doesn't collide with day number
    },
});
