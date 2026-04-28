import { styles } from "@/styles/insights.styles";
import type { MoodSummary } from "@/utils/moodStats";
import { moodToEmoji } from "@/utils/moodUi";
import { MOOD_BAR_COLORS, MOOD_ORDER, WEEKDAY_ORDER } from "@/utils/insights";
import React from "react";
import { Text, View } from "react-native";

export function MoodMixStripCard({
  title,
  summary,
}: {
  title: string;
  summary: MoodSummary;
}) {
  const total = Object.values(summary).reduce((sum, value) => sum + value, 0);

  return (
    <View style={styles.stripCard}>
      <Text style={styles.stripTitle}>{title}</Text>

      {total === 0 ? (
        <Text style={styles.emptyText}>No moods logged yet.</Text>
      ) : (
        <>
          <View style={styles.mixStrip}>
            {MOOD_ORDER.filter((mood) => summary[mood] > 0).map((mood) => (
              <View
                key={mood}
                style={[
                  styles.mixStripSegment,
                  {
                    flex: summary[mood],
                    backgroundColor: MOOD_BAR_COLORS[mood],
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.mixLegendRow}>
            {MOOD_ORDER.filter((mood) => summary[mood] > 0).map((mood) => (
              <View key={mood} style={styles.mixLegendItem}>
                <View
                  style={[
                    styles.mixLegendDot,
                    { backgroundColor: MOOD_BAR_COLORS[mood] },
                  ]}
                />
                <Text style={styles.mixLegendText}>{`${moodToEmoji[mood]} ${summary[mood]}`}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

export function WeekdayRhythmCard({
  items,
}: {
  items: { label: string; count: number; averageScore: number }[];
}) {
  const byWeekday = new Map(items.map((item) => [item.label, item]));

  return (
    <View style={styles.stripCard}>
      <Text style={styles.stripTitle}>Weekday rhythm</Text>
      <View style={styles.weekdayChart}>
        {WEEKDAY_ORDER.map((label) => {
          const item = byWeekday.get(label);
          const height = item ? Math.max(14, (item.averageScore / 5) * 72) : 10;

          return (
            <View key={label} style={styles.weekdayCol}>
              <Text style={styles.weekdayCount}>{item ? item.count : ""}</Text>
              <View style={styles.weekdayTrack}>
                <View
                  style={[
                    styles.weekdayBar,
                    {
                      height,
                      backgroundColor: item ? "#8DB2FF" : "#D8E2F6",
                    },
                  ]}
                />
              </View>
              <Text style={styles.weekdayLabel}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function MoodMixCard({
  title,
  summary,
  compact,
}: {
  title: string;
  summary: MoodSummary;
  compact: boolean;
}) {
  const max = Math.max(...Object.values(summary));

  return (
    <View style={[styles.detailCard, compact ? styles.halfCard : styles.fullCard]}>
      <Text style={styles.detailCardTitle}>{title}</Text>

      {max === 0 ? (
        <Text style={styles.emptyText}>No moods logged yet.</Text>
      ) : (
        <View style={styles.barsWrap}>
          {MOOD_ORDER.map((mood) => {
            const count = summary[mood];
            const width = `${Math.max(10, (count / max) * 100)}%` as `${number}%`;

            return (
              <View key={mood} style={styles.barRow}>
                <View style={styles.barLabelWrap}>
                  <Text style={styles.barEmoji}>{moodToEmoji[mood]}</Text>
                  <Text style={styles.barLabel}>{mood}</Text>
                </View>

                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width,
                        backgroundColor: MOOD_BAR_COLORS[mood],
                      },
                    ]}
                  />
                </View>

                <Text style={styles.barValue}>{count}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export function TagListCard({
  topTags,
  hardDayTags,
}: {
  topTags: { tag: string; count: number }[];
  hardDayTags: { tag: string; count: number }[];
}) {
  return (
    <View style={[styles.detailCard, styles.fullCard]}>
      <Text style={styles.detailCardTitle}>Tags that keep showing up</Text>

      <View style={styles.tagSection}>
        <Text style={styles.tagSectionLabel}>Most used</Text>
        {topTags.length === 0 ? (
          <Text style={styles.emptyText}>Add tags to reveal your recurring contexts.</Text>
        ) : (
          <View style={styles.tagWrap}>
            {topTags.map((item) => (
              <View key={`top-${item.tag}`} style={styles.tagPill}>
                <Text style={styles.tagText}>{`#${item.tag}`}</Text>
                <Text style={styles.tagCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.tagSection}>
        <Text style={styles.tagSectionLabel}>More common on tougher days</Text>
        {hardDayTags.length === 0 ? (
          <Text style={styles.emptyText}>Tag lower-mood days to reveal clearer tougher-day patterns.</Text>
        ) : (
          <View style={styles.tagWrap}>
            {hardDayTags.map((item) => (
              <View key={`hard-${item.tag}`} style={styles.tagPillWarm}>
                <Text style={styles.tagText}>{`#${item.tag}`}</Text>
                <Text style={styles.tagCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
