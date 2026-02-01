import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import ConfettiCannon from "react-native-confetti-cannon";

import { MoodPicker } from "@/components/mood";
import { TagChip } from "@/components/mood/TagChip";
import type { Mood, MoodEntry } from "@/types";
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
  onChangeNote: (note: string) => void;
  entriesMap: Record<string, MoodEntry>;
};

const TAG_PRESETS = ["work", "sleep", "family", "friends", "exercise", "study"] as const;
type TagPreset = (typeof TAG_PRESETS)[number];

function uniqClean(tags: string[]) {
  return Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean)));
}

export function DayCalendar({
  selectedDate,
  entry,
  onChangeMood,
  onChangeTags,
  onChangeNote,
  entriesMap,
}: Props) {
  const [isEditing, setIsEditing] = useState(!entry);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = Dimensions.get("window");

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  // Sound
  const soundRef = useRef<Audio.Sound | null>(null);

  // Note draft
  const [noteDraft, setNoteDraft] = useState(entry?.note ?? "");

  // Keep draft in sync when switching dates / entries change
  useEffect(() => {
    setNoteDraft(entry?.note ?? "");
  }, [entry?.updatedAt]);

  // Auto-save note (only after mood exists)
  useEffect(() => {
    if (!entry) return;

    const id = setTimeout(() => {
      if ((entry.note ?? "") === noteDraft) return;
      onChangeNote(noteDraft);
    }, 450);

    return () => clearTimeout(id);
  }, [noteDraft, entry?.updatedAt, entry, onChangeNote]);

  // Reset editing state when changing date / entry updates
  useEffect(() => {
    setIsEditing(!entry);
    cardOpacity.setValue(1);
  }, [selectedDate, entry?.updatedAt, cardOpacity, entry]);

  // Load sound once
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { sound } = await Audio.Sound.createAsync(
        require("@/assets/sounds/mood-select.mp3"),
        { volume: 0.4 }
      );
      if (mounted) soundRef.current = sound;
    })();

    return () => {
      mounted = false;
      soundRef.current?.unloadAsync();
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await soundRef.current?.replayAsync();
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

  const emoji = entry ? moodToEmoji[entry.mood] : "🙂";

  // Streaks
  const streak = getMoodStreak(entriesMap, selectedDate);
  const same = getSameMoodStreak(entriesMap, selectedDate);

  const glow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(99,102,241,0)", "rgba(99,102,241,0.35)"],
  });

  const selectedTags = useMemo(() => entry?.tags ?? [], [entry?.tags]);

  const toggleTag = async (tag: TagPreset) => {
    // ✅ must choose mood first
    if (!entry) return;

    const current = selectedTags;
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];

    try {
      onChangeTags(uniqClean(next));
      void Haptics.selectionAsync();
    } catch {}
  };

  return (
    <View style={styles.container}>
      {/* Sparkle */}
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

      <Text style={styles.dateText}>{selectedDate}</Text>

      {/* Emoji */}
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
          style={[styles.bigEmoji, { transform: [{ scale: scaleAnim }] }]}
        >
          {emoji}
        </Animated.Text>
      </Animated.View>

      {/* Logging streak */}
      {streak >= 3 && (
        <Text style={styles.streakText}>🔥 {streak}-day streak</Text>
      )}

      {/* Same mood streak */}
      {same.streak >= 3 && same.mood && (
        <Text style={styles.sameMoodStreakText}>
          {moodToEmoji[same.mood]} {same.streak}-day {same.mood} streak
        </Text>
      )}

      {/* Prompt / confirmation */}
      <Text style={styles.subtitle}>
        {entry ? "Nice — mood saved." : getDailyPrompt(selectedDate)}
      </Text>

      {/* TAGS (only after mood exists) */}
      {entry ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TAGS</Text>

          <View style={styles.tagsWrap}>
            {TAG_PRESETS.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                active={(entry.tags ?? []).includes(tag)}
                onPress={() => void toggleTag(tag)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* NOTE (only after mood exists) */}
      {entry ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTE</Text>

          <View style={styles.noteWrap}>
            <TextInput
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="Write a quick note…"
              placeholderTextColor="rgba(17,24,39,0.35)"
              multiline
              style={styles.noteInput}
            />
            <Text style={styles.autosaveText}>Auto-saved</Text>
          </View>
        </View>
      ) : null}

      {/* Picker */}
      {isEditing ? (
        <Animated.View style={{ opacity: cardOpacity, marginTop: 14 }}>
          <View style={styles.pickerWrap}>
            <View style={styles.pickerCard}>
              <MoodPicker value={entry?.mood ?? null} onChange={handlePick} />
            </View>
          </View>
        </Animated.View>
      ) : (
        <Pressable
          onPress={() => setIsEditing(true)}
          style={[styles.changeBtn, { marginTop: 14 }]}
        >
          <Text style={styles.changeBtnText}>Change mood</Text>
        </Pressable>
      )}
    </View>
  );
}
