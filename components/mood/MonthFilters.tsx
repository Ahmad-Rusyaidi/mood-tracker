// components/mood/MonthFilters.tsx
import type { Mood, MoodEntry } from "@/types";
import { toISODateLocal } from "@/utils";
import { moodToEmoji } from "@/utils/moodUi";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

export type MonthFiltersState = {
  moods: Mood[];
  tags: string[];
  onlyBadDays: boolean;
  onlyStreakDays: boolean;
};

const BAD_MOODS: Mood[] = ["sad", "angry", "anxious"];
const ALL_MOODS: Mood[] = ["happy", "neutral", "sad", "angry", "anxious"];

function uniqClean(arr: string[]) {
  return Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean)));
}

function getMonthTagOptions(entriesMap: Record<string, MoodEntry>, month: Date) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();

  const set = new Set<string>();
  for (let day = 1; day <= lastDay; day++) {
    const iso = toISODateLocal(new Date(y, m, day));
    const e = entriesMap[iso];
    if (!e?.tags?.length) continue;
    for (const t of e.tags) set.add(t);
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// streak dates: consecutive logged entries ending at selectedDate
function getLoggingStreakDates(
  entriesMap: Record<string, MoodEntry>,
  selectedDate: string
) {
  const out = new Set<string>();
  let cursor = new Date(selectedDate);

  while (true) {
    const key = toISODateLocal(cursor);
    if (!entriesMap[key]) break;
    out.add(key);
    cursor.setDate(cursor.getDate() - 1);
  }

  return out;
}

function Chip({
  label,
  active,
  onPress,
  variant,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  variant?: "clear";
}) {
  const isClear = variant === "clear";
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        backgroundColor: active ? "#111827" : isClear ? "#FEF2F2" : "#EEF2FF",
        borderColor: active ? "#111827" : isClear ? "#FCA5A5" : "#CBD5E1",
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "800",
          color: active ? "white" : isClear ? "#991B1B" : "#111827",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ✅ Emoji-only mood chip (5 per row)
function MoodEmojiChip({
  mood,
  active,
  onPress,
}: {
  mood: Mood;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: "100%",
        height: 40,
        borderRadius: 999,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? "#111827" : "#EEF2FF",
        borderColor: active ? "#111827" : "#CBD5E1",
      }}
      accessibilityRole="button"
      accessibilityLabel={`Filter mood: ${mood}`}
    >
      <Text style={{ fontSize: 18 }}>{moodToEmoji[mood]}</Text>
    </Pressable>
  );
}

export function MonthFilters({
  month,
  entriesMap,
  selectedDate,
  value,
  onChange,
}: {
  month: Date;
  entriesMap: Record<string, MoodEntry>;
  selectedDate: string;
  value: MonthFiltersState;
  onChange: (next: MonthFiltersState) => void;
}) {
  const monthTags = useMemo(
    () => getMonthTagOptions(entriesMap, month),
    [entriesMap, month]
  );

  const hasAny =
    value.moods.length > 0 ||
    value.tags.length > 0 ||
    value.onlyBadDays ||
    value.onlyStreakDays;

  const toggleMood = (m: Mood) => {
    const next = value.moods.includes(m)
      ? value.moods.filter((x) => x !== m)
      : [...value.moods, m];
    onChange({ ...value, moods: next });
  };

  const toggleTag = (t: string) => {
    const next = value.tags.includes(t)
      ? value.tags.filter((x) => x !== t)
      : uniqClean([...value.tags, t]);
    onChange({ ...value, tags: next });
  };

  const clearAll = () => {
    onChange({ moods: [], tags: [], onlyBadDays: false, onlyStreakDays: false });
  };

  return (
    <View style={{ gap: 10, marginBottom: 12, paddingHorizontal: 8 }}>
      {/* ✅ MOODS (emoji only, 5 per row) */}
      <View style={{ width: "100%" }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {ALL_MOODS.map((m) => (
            <View
              key={m}
              style={{
                width: "20%",          // ✅ 5 per row
                paddingHorizontal: 4,
                marginBottom: 8,
              }}
            >
              <MoodEmojiChip
                mood={m}
                active={value.moods.includes(m)}
                onPress={() => toggleMood(m)}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Toggles */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
        }}
      >
        <Chip
          label="Bad days"
          active={value.onlyBadDays}
          onPress={() =>
            onChange({ ...value, onlyBadDays: !value.onlyBadDays })
          }
        />
        <Chip
          label="Streak days"
          active={value.onlyStreakDays}
          onPress={() =>
            onChange({ ...value, onlyStreakDays: !value.onlyStreakDays })
          }
        />
        {hasAny ? <Chip label="Clear" variant="clear" onPress={clearAll} /> : null}
      </View>

      {/* Tags */}
      {monthTags.length > 0 ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
          }}
        >
          {monthTags.slice(0, 12).map((t) => (
            <Chip
              key={t}
              label={`#${t}`}
              active={value.tags.includes(t)}
              onPress={() => toggleTag(t)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function makeDimPredicate(args: {
  filters: MonthFiltersState;
  entriesMap: Record<string, MoodEntry>;
  selectedDate: string;
}) {
  const { filters, entriesMap, selectedDate } = args;

  const hasAny =
    filters.moods.length > 0 ||
    filters.tags.length > 0 ||
    filters.onlyBadDays ||
    filters.onlyStreakDays;

  const streakDates = filters.onlyStreakDays
    ? getLoggingStreakDates(entriesMap, selectedDate)
    : new Set<string>();

  return (date: string, entry?: MoodEntry) => {
    if (!hasAny) return false;

    if (filters.onlyStreakDays && !streakDates.has(date)) return true;

    if (
      (filters.moods.length > 0 ||
        filters.onlyBadDays ||
        filters.tags.length > 0) &&
      !entry
    )
      return true;

    if (filters.onlyBadDays && entry && !BAD_MOODS.includes(entry.mood))
      return true;

    if (filters.moods.length > 0 && entry && !filters.moods.includes(entry.mood))
      return true;

    if (filters.tags.length > 0 && entry) {
      const entryTags = entry.tags ?? [];
      const ok = filters.tags.every((t) => entryTags.includes(t)); // AND logic
      if (!ok) return true;
    }

    return false;
  };
}
