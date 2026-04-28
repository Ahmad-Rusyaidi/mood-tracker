import type { MoodEntry } from "@/types";
import {
  countLoggedDaysInWeek,
  getEntriesForWeek,
  getTopTags,
  getWeekComparison,
  getWeekWarnings,
} from "@/utils/moodStats";
import { moodToEmoji } from "@/utils/moodUi";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { weekCalendarStyles as styles } from "@/styles/mood/WeekCalendar.styles";

function addDays(date: Date, delta: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

function startOfWeek(date: Date) {
  return addDays(date, -date.getDay());
}

function toISODateLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISODateLocal(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

function formatWeekRange(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const endLabel = end.toLocaleDateString(undefined, {
    month: sameMonth ? undefined : "short",
    day: "numeric",
  });
  return `${startLabel} - ${endLabel}`;
}

function getHeadline(loggedDays: number, delta: number | null, allDaysLogged: boolean) {
  if (loggedDays === 0) {
    return {
      title: "A fresh week is waiting for you.",
      subtitle: "A couple of check-ins will help this week start telling a story.",
    };
  }

  if (allDaysLogged) {
    return {
      title: "You showed up for yourself every day this week.",
      subtitle: "That kind of consistency is worth noticing.",
    };
  }

  if (delta != null && delta >= 0.8) {
    return {
      title: "A steadier week than last time.",
      subtitle: "Something felt a little lighter this week.",
    };
  }

  if (delta != null && delta <= -0.8) {
    return {
      title: "This week felt heavy, but you kept showing up.",
      subtitle: "Even a hard week still counts as progress.",
    };
  }

  if (loggedDays >= 5) {
    return {
      title: "You stayed in touch with yourself this week.",
      subtitle: "These check-ins are starting to build a clearer picture.",
    };
  }

  return {
    title: "A few check-ins can still say a lot.",
    subtitle: "You have enough here to notice the shape of the week.",
  };
}

function getReflectionPrompt(weekEntries: MoodEntry[], loggedDays: number, allDaysLogged: boolean) {
  const topTag = getTopTags(weekEntries, 1)[0];

  if (topTag) {
    return `What about #${topTag.tag} stood out most this week?`;
  }

  if (allDaysLogged) {
    return "What would you want to carry from this week into the next one?";
  }

  if (loggedDays >= 4) {
    return "What helped the better days feel a little easier?";
  }

  return "What feels most worth noticing from this week so far?";
}

export function WeekCalendar({
  anchorDate,
  selectedDate,
  entriesMap,
  onNavigateWeek,
  onJumpToToday,
  onSelectDate,
}: {
  anchorDate: Date;
  selectedDate: string;
  entriesMap: Record<string, MoodEntry>;
  onNavigateWeek: (delta: number) => void;
  onJumpToToday: () => void;
  onSelectDate: (date: string) => void;
}) {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const days = useMemo(() => {
    const base = new Date(anchorDate);
    const start = startOfWeek(base);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(start, i);
      const iso = toISODateLocal(d);
      return {
        date: iso,
        label: d.toLocaleString(undefined, { weekday: "short" }),
        day: d.getDate(),
      };
    });
  }, [anchorDate]);

  const weekEntries = useMemo(
    () => getEntriesForWeek(Object.values(entriesMap), anchorDate),
    [entriesMap, anchorDate]
  );

  const comparison = useMemo(
    () => getWeekComparison(Object.values(entriesMap), anchorDate),
    [entriesMap, anchorDate]
  );

  const loggedDays = useMemo(
    () => countLoggedDaysInWeek(entriesMap, anchorDate),
    [entriesMap, anchorDate]
  );
  const warnings = useMemo(
    () => getWeekWarnings(Object.values(entriesMap), anchorDate),
    [entriesMap, anchorDate]
  );

  const allDaysLogged = loggedDays === 7;
  const isCurrentWeek =
    toISODateLocal(startOfWeek(anchorDate)) === toISODateLocal(startOfWeek(today));
  const headline = getHeadline(loggedDays, comparison.delta, allDaysLogged);
  const reflectionPrompt = getReflectionPrompt(weekEntries, loggedDays, allDaysLogged);
  const weekRange = formatWeekRange(
    parseISODateLocal(days[0].date),
    parseISODateLocal(days[days.length - 1].date)
  );

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        <Pressable onPress={() => onNavigateWeek(-1)} style={styles.navButton}>
          <Text style={styles.navButtonText}>Previous week</Text>
        </Pressable>

        <Pressable
          onPress={onJumpToToday}
          style={[styles.navButton, isCurrentWeek ? styles.navButtonMuted : styles.navButtonToday]}
        >
          <Text
            style={[
              styles.navButtonText,
              isCurrentWeek ? styles.navButtonTextMuted : styles.navButtonTextToday,
            ]}
          >
            This week
          </Text>
        </Pressable>

        <Pressable onPress={() => onNavigateWeek(1)} style={styles.navButton}>
          <Text style={styles.navButtonText}>Next week</Text>
        </Pressable>
      </View>

      <Text style={styles.rangeText}>{weekRange}</Text>

      <View style={styles.weekRow}>
        {days.map((d) => {
          const entry = entriesMap[d.date];
          const isSelected = d.date === selectedDate;

          return (
            <Pressable
              key={d.date}
              onPress={() => onSelectDate(d.date)}
              style={[styles.dayCard, isSelected ? styles.dayCardSelected : null]}
            >
              <Text style={styles.dayLabel}>{d.label}</Text>
              <Text style={styles.dayNumber}>{d.day}</Text>
              <Text style={styles.dayEmoji}>{entry ? moodToEmoji[entry.mood] : ""}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.summaryStack}>
        <View style={styles.headlineCard}>
          <Text style={styles.headlineEyebrow}>This week</Text>
          <Text style={styles.headlineText}>{headline.title}</Text>
          <Text style={styles.headlineSubtext}>{headline.subtitle}</Text>
        </View>

        {warnings.length > 0 ? (
          <View style={styles.warningStack}>
            {warnings.map((warning) => {
              const canOpen = warning.key && warning.band;

              return (
                <Pressable
                  key={warning.id}
                  disabled={!canOpen}
                  onPress={
                    canOpen
                      ? () =>
                          router.push({
                            pathname: "/history",
                            params: {
                              contextKey: warning.key,
                              contextBand: warning.band,
                            },
                          })
                      : undefined
                  }
                  style={[
                    styles.warningCard,
                    canOpen ? styles.warningCardPressable : null,
                  ]}
                >
                  <Text style={styles.warningLabel}>What to watch</Text>
                  <Text style={styles.warningTitle}>{warning.title}</Text>
                  <Text style={styles.warningDetail}>{warning.detail}</Text>
                  {canOpen ? (
                    <View style={styles.warningLinkPill}>
                      <Text style={styles.warningLinkText}>View matching days</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.reflectionCard}>
          <Text style={styles.reflectionLabel}>Reflection prompt</Text>
          <Text style={styles.reflectionText}>{reflectionPrompt}</Text>
        </View>
      </View>
    </View>
  );
}
