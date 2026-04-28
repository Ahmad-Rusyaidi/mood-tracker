import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import ConfettiCannon from "react-native-confetti-cannon";

import { MoodPicker } from "@/components/mood";
import { TagChip } from "@/components/mood/TagChip";
import { DEFAULT_TAGS } from "@/constants/tags";
import type { ContextScale, Mood, MoodContextKey, MoodEntry } from "@/types";
import { getDailyPrompt } from "@/utils/moodPrompts";
import { moodSparkleColors } from "@/utils/moodSparkle";
import { getMoodStreak, getSameMoodStreak } from "@/utils/moodStats";
import { moodToEmoji } from "@/utils/moodUi";

import { dayCalendarStyles as styles } from "../../styles/mood/Daycalendar.styles";

type Props = {
  selectedDate: string;
  entry: MoodEntry | null;
  onChangeMood: (mood: Mood) => void;
  onChangeTags: (tags: string[]) => void;
  onChangeContext: (key: MoodContextKey, value: ContextScale | null) => void;
  entriesMap: Record<string, MoodEntry>;
  availableTags: string[];
  onCreateCustomTag: (tag: string) => Promise<unknown>;
};

type ContextField = {
  key: MoodContextKey;
  title: string;
  lowLabel: string;
  highLabel: string;
  accent: string;
};

const CONTEXT_FIELDS: ContextField[] = [
  {
    key: "energy",
    title: "Energy",
    lowLabel: "Low",
    highLabel: "High",
    accent: "#F59E0B",
  },
  {
    key: "stress",
    title: "Stress",
    lowLabel: "Calm",
    highLabel: "High",
    accent: "#F97316",
  },
  {
    key: "sleep",
    title: "Sleep",
    lowLabel: "Bad",
    highLabel: "Great",
    accent: "#3B82F6",
  },
] as const;

const SCALE_VALUES: ContextScale[] = [1, 2, 3, 4, 5];

function uniqClean(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseISODate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function diffDaysFromToday(iso: string) {
  const today = startOfDay(new Date());
  const target = startOfDay(parseISODate(iso));
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatFriendlyDate(iso: string) {
  const date = parseISODate(iso);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type HeaderKind = "today" | "yesterday" | "tomorrow" | "date";

function isLateNightNow() {
  const now = new Date();
  return now.getHours() >= 22;
}

const ACCENT: Record<HeaderKind, string> = {
  today: "#7C3AED",
  yesterday: "#2563EB",
  tomorrow: "#10B981",
  date: "#111827",
};

function getHeaderInfo(iso: string) {
  const diff = diffDaysFromToday(iso);

  if (diff === 0) {
    return {
      kind: "today" as const,
      title: isLateNightNow() ? "Late night check-in" : "Today's vibe",
      showDate: true,
      accent: ACCENT.today,
    };
  }

  if (diff === -1) {
    return {
      kind: "yesterday" as const,
      title: "Yesterday recap",
      showDate: true,
      accent: ACCENT.yesterday,
    };
  }

  if (diff === 1) {
    return {
      kind: "tomorrow" as const,
      title: "Tomorrow preview",
      showDate: true,
      accent: ACCENT.tomorrow,
    };
  }

  return {
    kind: "date" as const,
    title: formatFriendlyDate(iso),
    showDate: false,
    accent: ACCENT.date,
  };
}

function getSubtitle(iso: string, hasEntry: boolean) {
  const diff = diffDaysFromToday(iso);

  if (hasEntry) {
    if (diff === 0) {
      return isLateNightNow() ? "Nice check-in before bed." : "Saved for today.";
    }
    if (diff === -1) return "A quick look back at yesterday.";
    if (diff === 1) return "You can plan tomorrow a little here.";
    return `Your check-in for ${formatFriendlyDate(iso)}.`;
  }

  if (diff === 0) {
    return isLateNightNow() ? "How did today actually feel?" : "How are you feeling today?";
  }
  if (diff === -1) return "What was yesterday like?";
  if (diff === 1) return "What do you want tomorrow to feel like?";
  return getDailyPrompt(iso);
}

function getInitialContextIndex(entry: MoodEntry | null) {
  if (!entry) return 0;

  const firstMissingIndex = CONTEXT_FIELDS.findIndex((field) => entry[field.key] == null);
  return firstMissingIndex === -1 ? CONTEXT_FIELDS.length - 1 : firstMissingIndex;
}

function getCompletedContextCount(entry: MoodEntry | null) {
  if (!entry) return 0;
  return CONTEXT_FIELDS.filter((field) => entry[field.key] != null).length;
}

function ContextScaleRow({
  field,
  value,
  onChange,
  onSkip,
}: {
  field: ContextField;
  value?: ContextScale;
  onChange: (value: ContextScale | null) => void;
  onSkip: () => void;
}) {
  return (
    <View style={styles.contextCard}>
      <View style={styles.contextCardHeader}>
        <View style={styles.contextTitleWrap}>
          <Text style={styles.contextTitle}>{field.title}</Text>
          <Text style={styles.contextValue}>{value ? `${value}/5` : "Skip"}</Text>
        </View>

        <Pressable onPress={value ? () => onChange(null) : onSkip} hitSlop={8}>
          <Text style={styles.contextClear}>{value ? "Clear" : "Skip"}</Text>
        </Pressable>
      </View>

      <View style={styles.contextScaleRow}>
        {SCALE_VALUES.map((step) => {
          const active = value != null && step <= value;
          const isSelected = value === step;

          return (
            <Pressable
              key={step}
              onPress={() => onChange(step)}
              style={[
                styles.contextScaleStep,
                active ? { backgroundColor: field.accent, borderColor: field.accent } : null,
                isSelected ? styles.contextScaleStepSelected : null,
              ]}
            >
              <Text
                style={[
                  styles.contextScaleStepText,
                  active ? styles.contextScaleStepTextActive : null,
                ]}
              >
                {step}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.contextScaleLabels}>
        <Text style={styles.contextScaleLabel}>{field.lowLabel}</Text>
        <Text style={styles.contextScaleLabel}>{field.highLabel}</Text>
      </View>
    </View>
  );
}

export function DayCalendar({
  selectedDate,
  entry,
  onChangeMood,
  onChangeTags,
  onChangeContext,
  entriesMap,
  availableTags,
  onCreateCustomTag,
}: Props) {
  const [isEditing, setIsEditing] = useState(!entry);
  const [showConfetti, setShowConfetti] = useState(false);
  const [customTagDraft, setCustomTagDraft] = useState("");
  const [activeContextIndex, setActiveContextIndex] = useState(() =>
    getInitialContextIndex(entry)
  );
  const [showContextCelebration, setShowContextCelebration] = useState(false);
  const [showContextSummary, setShowContextSummary] = useState(
    getCompletedContextCount(entry) === CONTEXT_FIELDS.length
  );
  const { width, height } = Dimensions.get("window");
  const { height: windowHeight } = useWindowDimensions();
  const compactLayout = windowHeight < 820;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const contextCelebrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousContextCompleteRef = useRef(
    getCompletedContextCount(entry) === CONTEXT_FIELDS.length
  );

  const sfxPlayer = useAudioPlayer(require("@/assets/sounds/mood-select.mp3"));

  useEffect(() => {
    setIsEditing(!entry);
    setActiveContextIndex(getInitialContextIndex(entry));
    setShowContextSummary(getCompletedContextCount(entry) === CONTEXT_FIELDS.length);
    cardOpacity.setValue(1);
  }, [selectedDate, entry?.updatedAt, entry, cardOpacity]);

  useEffect(() => {
    return () => {
      if (contextCelebrationTimeoutRef.current) {
        clearTimeout(contextCelebrationTimeoutRef.current);
      }
    };
  }, []);

  const animateEmoji = () => {
    scaleAnim.setValue(0.85);
    glowAnim.setValue(1);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const fadeCardOut = () => {
    Animated.timing(cardOpacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const playFeedback = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      sfxPlayer.seekTo(0);
      sfxPlayer.play();
    } catch {}
  };

  const handlePick = async (mood: Mood) => {
    const isFirstEver = !entry;

    onChangeMood(mood);
    setIsEditing(false);

    animateEmoji();
    fadeCardOut();
    void playFeedback();

    if (isFirstEver) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
    }
  };

  const emoji = entry ? moodToEmoji[entry.mood] : moodToEmoji.neutral;
  const streak = getMoodStreak(entriesMap, selectedDate);
  const same = getSameMoodStreak(entriesMap, selectedDate);

  const glow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(99,102,241,0)", "rgba(99,102,241,0.35)"],
  });

  const selectedTags = useMemo(() => entry?.tags ?? [], [entry?.tags]);
  const allTags = useMemo(
    () => uniqClean([...DEFAULT_TAGS, ...availableTags]),
    [availableTags]
  );

  const contextProgress = useMemo(
    () =>
      CONTEXT_FIELDS.map((field) => ({
        ...field,
        value: entry?.[field.key],
      })),
    [entry]
  );

  const activeContextField = CONTEXT_FIELDS[activeContextIndex];
  const activeContextValue = activeContextField ? entry?.[activeContextField.key] : undefined;
  const completedContextCount = getCompletedContextCount(entry);
  const allContextComplete = completedContextCount === CONTEXT_FIELDS.length;

  useEffect(() => {
    if (allContextComplete && !previousContextCompleteRef.current) {
      setShowContextCelebration(true);
      setShowContextSummary(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (contextCelebrationTimeoutRef.current) {
        clearTimeout(contextCelebrationTimeoutRef.current);
      }

      contextCelebrationTimeoutRef.current = setTimeout(() => {
        setShowContextCelebration(false);
      }, 2200);
    }

    if (!allContextComplete) {
      setShowContextCelebration(false);
      setShowContextSummary(false);
      if (contextCelebrationTimeoutRef.current) {
        clearTimeout(contextCelebrationTimeoutRef.current);
        contextCelebrationTimeoutRef.current = null;
      }
    }

    previousContextCompleteRef.current = allContextComplete;
  }, [allContextComplete]);

  const toggleTag = async (tag: string) => {
    if (!entry) return;

    const next = selectedTags.includes(tag)
      ? selectedTags.filter((current) => current !== tag)
      : [...selectedTags, tag];

    try {
      onChangeTags(uniqClean(next));
      void Haptics.selectionAsync();
    } catch {}
  };

  const handleAddCustomTag = async () => {
    if (!entry) return;

    const nextTag = customTagDraft.trim().toLowerCase();
    if (!nextTag) return;

    try {
      await onCreateCustomTag(nextTag);
      if (!selectedTags.includes(nextTag)) {
        onChangeTags(uniqClean([...selectedTags, nextTag]));
      }
      setCustomTagDraft("");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const handleContextChange = (key: MoodContextKey, value: ContextScale | null) => {
    if (!entry) return;

    setShowContextSummary(false);
    onChangeContext(key, value);
    void Haptics.selectionAsync();

    if (value != null) {
      const nextIndex = CONTEXT_FIELDS.findIndex((field) => field.key === key) + 1;
      if (nextIndex < CONTEXT_FIELDS.length) {
        setActiveContextIndex(nextIndex);
      }
    }
  };

  const handleSkipContext = () => {
    if (!activeContextField) return;
    setShowContextSummary(false);
    if (activeContextIndex < CONTEXT_FIELDS.length - 1) {
      setActiveContextIndex(activeContextIndex + 1);
    }
    void Haptics.selectionAsync();
  };

  const handleEditCompletedContext = () => {
    const firstFilledIndex = contextProgress.findIndex((field) => field.value != null);
    setShowContextCelebration(false);
    setShowContextSummary(false);
    setActiveContextIndex(firstFilledIndex === -1 ? 0 : firstFilledIndex);
    void Haptics.selectionAsync();
  };

  const headerInfo = useMemo(() => getHeaderInfo(selectedDate), [selectedDate]);
  const subtitle = useMemo(() => getSubtitle(selectedDate, !!entry), [selectedDate, entry]);

  return (
    <View style={styles.container}>
      {showConfetti && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height,
            zIndex: 999,
          }}
        >
          <ConfettiCannon
            count={45}
            origin={{ x: -500, y: height - 500 }}
            explosionSpeed={140}
            fallSpeed={4000}
            fadeOut
            colors={moodSparkleColors[entry?.mood ?? "neutral"]}
          />
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.dateText, { color: headerInfo.accent }]}>{headerInfo.title}</Text>

        {headerInfo.showDate ? (
          <Text style={styles.dateSubText}>{formatFriendlyDate(selectedDate)}</Text>
        ) : null}

        <Text style={styles.subtitle}>{subtitle}</Text>

        <Animated.View
          style={[
            {
              shadowRadius: 24,
              shadowOpacity: 1,
              shadowOffset: { width: 0, height: 0 },
              backgroundColor: "transparent",
            },
            { shadowColor: glow },
          ]}
        >
          <Animated.Text
            style={[
              styles.bigEmoji,
              compactLayout ? styles.bigEmojiCompact : null,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            {emoji}
          </Animated.Text>
        </Animated.View>

        {streak >= 3 ? <Text style={styles.streakText}>Streak: {streak} days</Text> : null}

        {same.streak >= 3 && same.mood ? (
          <Text style={styles.sameMoodStreakText}>
            {same.streak} straight days of {same.mood}
          </Text>
        ) : null}

        {entry ? (
          <View style={[styles.section, compactLayout ? styles.sectionCompact : null]}>
            <Text style={styles.sectionTitle}>Tags</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsScrollContent}
              style={styles.tagsScroll}
              keyboardShouldPersistTaps="handled"
            >
              {allTags.map((tag) => (
                <TagChip
                  key={tag}
                  label={tag}
                  active={(entry.tags ?? []).includes(tag)}
                  onPress={() => void toggleTag(tag)}
                />
              ))}
            </ScrollView>

            <View style={styles.customTagComposer}>
              <TextInput
                value={customTagDraft}
                onChangeText={setCustomTagDraft}
                placeholder="Add custom tag"
                placeholderTextColor="rgba(17,24,39,0.35)"
                style={styles.customTagInput}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => void handleAddCustomTag()}
              />

              <Pressable
                onPress={() => void handleAddCustomTag()}
                style={styles.customTagButton}
              >
                <Text style={styles.customTagButtonText}>Add tag</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {entry && activeContextField ? (
          <View style={[styles.section, compactLayout ? styles.sectionCompact : null]}>
            <Text style={styles.sectionTitle}>Quick extras</Text>
            <Text style={styles.sectionHint}>
              {allContextComplete
                ? "Done. Your quick extras are saved."
                : `Add ${completedContextCount}/3 if you want a fuller check-in.`}
            </Text>

            <View style={styles.contextWrap}>
              <View style={styles.contextProgressRow}>
                {contextProgress.map((field, index) => {
                  const completed = field.value != null;
                  const active = index === activeContextIndex && !allContextComplete;

                  return (
                    <Pressable
                      key={field.key}
                      onPress={() => setActiveContextIndex(index)}
                      style={[
                        styles.contextStepChip,
                        completed ? styles.contextStepChipDone : null,
                        active ? styles.contextStepChipActive : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.contextStepLabel,
                          active ? styles.contextStepLabelActive : null,
                        ]}
                      >
                        {field.title}
                      </Text>
                      <Text
                        style={[
                          styles.contextStepValue,
                          active ? styles.contextStepValueActive : null,
                        ]}
                      >
                        {field.value ? `${field.value}/5` : "Skip"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {allContextComplete && showContextSummary ? (
                <View
                  style={[
                    styles.contextCompletionCard,
                    showContextCelebration ? styles.contextCompletionCardCelebrate : null,
                  ]}
                >
                  <Text style={styles.contextCompletionBadge}>All 3 done</Text>
                  <Text style={styles.contextCompletionTitle}>Nice, that check-in is complete.</Text>

                  <Pressable
                    onPress={handleEditCompletedContext}
                    style={styles.contextCompletionButton}
                  >
                    <Text style={styles.contextCompletionButtonText}>Edit extras</Text>
                  </Pressable>
                </View>
              ) : (
                <ContextScaleRow
                  field={activeContextField}
                  value={activeContextValue}
                  onChange={(value) => handleContextChange(activeContextField.key, value)}
                  onSkip={handleSkipContext}
                />
              )}
            </View>
          </View>
        ) : null}

        {isEditing ? (
          <Animated.View style={{ opacity: cardOpacity, marginTop: 14 }}>
            <View style={styles.pickerWrap}>
              <View style={styles.pickerCard}>
                <MoodPicker value={entry?.mood ?? null} onChange={handlePick} />
              </View>
            </View>
          </Animated.View>
        ) : (
          <Pressable onPress={() => setIsEditing(true)} style={[styles.changeBtn, { marginTop: 14 }]}>
            <Text style={styles.changeBtnText}>Change mood</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
