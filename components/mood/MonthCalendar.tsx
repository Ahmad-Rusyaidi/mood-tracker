import { colors, radius, spacing } from "@/styles";
import type { MoodEntry } from "@/types";
import {
    addMonths,
    dayOfWeek,
    daysInMonth,
    monthLabel,
    startOfMonth,
    toISODateLocal,
} from "@/utils";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
    month: Date; // any date within the month
    selectedDate: string; // YYYY-MM-DD
    entriesMap: Record<string, MoodEntry>;
    onChangeMonth: (nextMonth: Date) => void;
    onSelectDate: (date: string) => void;
};

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthCalendar({
    month,
    selectedDate,
    entriesMap,
    onChangeMonth,
    onSelectDate,
}: Props) {
    const grid = useMemo(() => {
        const first = startOfMonth(month);
        const offset = dayOfWeek(first); // 0..6
        const total = daysInMonth(month);

        const cells: Array<{ date: string | null; day: number | null }> = [];
        for (let i = 0; i < offset; i++) cells.push({ date: null, day: null });

        for (let day = 1; day <= total; day++) {
            const d = new Date(month.getFullYear(), month.getMonth(), day);
            cells.push({ date: toISODateLocal(d), day });
        }

        while (cells.length % 7 !== 0) cells.push({ date: null, day: null });
        return cells;
    }, [month]);

    return (
        <View style={styles.wrap}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => onChangeMonth(addMonths(month, -1))}
                    style={styles.navBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Previous month"
                >
                    <Text style={styles.navText}>‹</Text>
                </Pressable>

                <Text style={styles.monthText}>{monthLabel(month)}</Text>

                <Pressable
                    onPress={() => onChangeMonth(addMonths(month, 1))}
                    style={styles.navBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Next month"
                >
                    <Text style={styles.navText}>›</Text>
                </Pressable>
            </View>

            <View style={styles.dowRow}>
                {DOW.map((d, i) => (
                    <Text key={`${d}-${i}`} style={styles.dowText}>
                        {d}
                    </Text>
                ))}
            </View>


            <View style={styles.grid}>
                {grid.map((cell, idx) => {
                    if (!cell.date || !cell.day) {
                        return <View key={idx} style={styles.cell} />;
                    }

                    const isSelected = cell.date === selectedDate;
                    const hasEntry = !!entriesMap[cell.date];

                    return (
                        <Pressable
                            key={cell.date}
                            onPress={() => onSelectDate(cell.date!)}
                            style={[
                                styles.cell,
                                styles.dayCell,
                                isSelected && styles.daySelected,
                            ]}
                        >
                            <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                                {cell.day}
                            </Text>
                            {hasEntry ? <View style={styles.dot} /> : <View style={styles.dotPlaceholder} />}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        padding: spacing.md,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.sm,
    },
    navBtn: {
        width: 40,
        height: 36,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    navText: { fontSize: 22, color: colors.text },
    monthText: { fontSize: 16, fontWeight: "700", color: colors.text },

    dowRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.sm,
        paddingHorizontal: 4,
    },
    dowText: { width: 36, textAlign: "center", color: colors.mutedText, fontSize: 12 },

    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
    },
    cell: {
        width: 36,
        height: 44,
    },
    dayCell: {
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    daySelected: {
        borderColor: "#111827",
        backgroundColor: "#F3F4F6",
    },
    dayText: { color: colors.text, fontSize: 14, fontWeight: "600" },
    dayTextSelected: { color: colors.text },

    dot: {
        marginTop: 4,
        width: 6,
        height: 6,
        borderRadius: 999,
        backgroundColor: "#111827",
    },
    dotPlaceholder: {
        marginTop: 4,
        width: 6,
        height: 6,
        borderRadius: 999,
        backgroundColor: "transparent",
    },
});
