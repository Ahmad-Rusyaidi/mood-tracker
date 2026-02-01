import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Pressable, Text, View } from "react-native";

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
  entriesMap: Record<string, MoodEntry>;
};

export function DayCalendar({
  selectedDate,
  entry,
  onChangeMood,
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

  useEffect(() => {
    setIsEditing(!entry);
    cardOpacity.setValue(1);
  }, [selectedDate, entry?.mood]);

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
    playFeedback();

    if (isFirstEver) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
    }
  };

  const emoji = entry ? moodToEmoji[entry.mood] : "🙂";

  // 🔥 FEATURE 2: mood streak
  const streak = getMoodStreak(entriesMap, selectedDate);

  const glow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(99,102,241,0)", "rgba(99,102,241,0.35)"],
  });

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
            count={50}
            origin={{ x: -500, y: height - 500 }}
            explosionSpeed={140}
            fallSpeed={3600}
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
          style={[
            styles.bigEmoji,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {emoji}
        </Animated.Text>
      </Animated.View>

      {/* 🔥 Streak */}
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

      {/* Picker */}
      {isEditing ? (
        <Animated.View style={{ opacity: cardOpacity }}>
          <View style={styles.pickerWrap}>
            <View style={styles.pickerCard}>
              <MoodPicker
                value={entry?.mood ?? null}
                onChange={handlePick}
              />
            </View>
          </View>
        </Animated.View>
      ) : (
        <Pressable
          onPress={() => setIsEditing(true)}
          style={styles.changeBtn}
        >
          <Text style={styles.changeBtnText}>Change mood</Text>
        </Pressable>
      )}
    </View>
  );
}
