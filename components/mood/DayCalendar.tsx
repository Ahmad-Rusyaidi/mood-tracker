import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Pressable, Text, TextInput, View } from "react-native";

import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import ConfettiCannon from "react-native-confetti-cannon";

import { MoodPicker } from "@/components/mood";
import type { Mood, MoodEntry } from "@/types";
import { getDailyPrompt } from "@/utils/moodPrompts";
import { moodSparkleColors } from "@/utils/moodSparkle";
import { getMoodStreak } from "@/utils/moodStats";
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

function TagChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: active ? "#111827" : "#EEF2FF",
        borderWidth: 1,
        borderColor: active ? "#111827" : "#CBD5E1",
      }}
    >
      <Text
        style={{
          fontWeight: "800",
          fontSize: 12,
          color: active ? "white" : "#111827",
        }}
      >
        #{label}
      </Text>
    </Pressable>
  );
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
  const [noteDraft, setNoteDraft] = useState(entry?.note ?? "");

  useEffect(() => {
    setNoteDraft(entry?.note ?? "");
  }, [entry?.updatedAt]);

  useEffect(() => {
    if (!entry) return; // mood must exist first (same UX rule as tags)

    const id = setTimeout(() => {
      // avoid writing if unchanged
      if ((entry.note ?? "") === noteDraft) return;
      onChangeNote(noteDraft);
    }, 450);

    return () => clearTimeout(id);
  }, [noteDraft, entry?.updatedAt]);


  useEffect(() => {
    setIsEditing(!entry);
    cardOpacity.setValue(1);
  }, [selectedDate, entry?.updatedAt]);

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
    } catch { }
  };

  const handlePick = async (mood: Mood) => {
    const isFirstEver = !entry;

    onChangeMood(mood);
    setIsEditing(false);

    animateEmoji();
    fadeCardOut();
    playFeedback();

    if (isFirstEver) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
    }
  };

  const emoji = entry ? moodToEmoji[entry.mood] : "🙂";

  // mood streak
  const streak = getMoodStreak(entriesMap, selectedDate);

  const glow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(99,102,241,0)", "rgba(99,102,241,0.35)"],
  });

  const selectedTags = useMemo(() => entry?.tags ?? [], [entry?.tags]);

  const toggleTag = async (tag: TagPreset) => {
    const current = selectedTags;
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];

    try {
      onChangeTags(uniqClean(next));
      Haptics.selectionAsync();
    } catch { }
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

      {/* Streak */}
      {streak >= 3 && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: "800",
            color: "#F59E0B",
            marginTop: 4,
          }}
        >
          🔥 {streak}-day streak
        </Text>
      )}

      {/* Prompt / confirmation */}
      <Text style={styles.subtitle}>
        {entry ? "Nice — mood saved." : getDailyPrompt(selectedDate)}
      </Text>

      {/* TAGS */}
      {entry ? (
        <View style={{ marginTop: 14, width: "100%" }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "800",
              opacity: 0.6,
              textAlign: "center",
            }}
          >
            TAGS
          </Text>

          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 10,
            }}
          >
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
      ) : (
        <View style={{ marginTop: 0 }}>
          
        </View>
      )}

      {/* NOTE */}
      {entry ? (
        <View style={{ marginTop: 14, width: "100%" }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "800",
              opacity: 0.6,
              textAlign: "center",
            }}
          >
            NOTE
          </Text>

          <View style={{ marginTop: 10, paddingHorizontal: 16 }}>
            <TextInput
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="Write a quick note…"
              placeholderTextColor="rgba(17,24,39,0.35)"
              multiline
              style={{
                minHeight: 50,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                backgroundColor: "#F8FAFF",
                borderWidth: 1,
                borderColor: "#CBD5E1",
                fontSize: 14,
              }}
            />
            <Text style={{ marginTop: 6, fontSize: 11, opacity: 0.5, textAlign: "right" }}>
              Auto-saved
            </Text>
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 0 }}>
          
        </View>
      )}

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
