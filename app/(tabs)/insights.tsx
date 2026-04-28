import {
  CompareCard,
  GuidanceCard,
  HeroCard,
  PatternCard,
  SectionHeader,
  SignalCard,
  SpotlightCard,
  StatPill,
} from "@/components/insights/InsightCards";
import {
  MoodMixCard,
  MoodMixStripCard,
  TagListCard,
  WeekdayRhythmCard,
} from "@/components/insights/InsightBreakdown";
import { useInsightsScreen } from "@/hooks";
import { spacing } from "@/styles";
import { styles } from "@/styles/insights.styles";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InsightsScreen() {
  const router = useRouter();
  const insights = useInsightsScreen();

  const openMonthHistory = () =>
    router.push({
      pathname: "/history",
      params: { month: insights.currentMonthKey },
    });

  const openTagHistory = (tag: string) =>
    router.push({
      pathname: "/history",
      params: { tag, month: insights.currentMonthKey },
    });

  const openContextHistory = (
    target: (typeof insights.highlights.signalCards)[number]["target"]
  ) => {
    if (!target) return;

    router.push({
      pathname: "/history",
      params: {
        contextKey: target.key,
        contextBand: target.band,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {insights.screenState === "loading" ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Loading insights...</Text>
          <Text style={styles.stateText}>
            Turning your check-ins into a cleaner picture.
          </Text>
        </View>
      ) : insights.screenState === "empty" ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>No insights yet</Text>
          <Text style={styles.stateText}>
            Log a few moods first. Tags and context signals will make this page much more useful.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <SectionHeader title="This week" />

            <HeroCard
              eyebrow={insights.weekly.weekStory.eyebrow}
              title={insights.weekly.weekStory.title}
              body={insights.weekly.weekStory.body}
              action={insights.weekly.actionHint}
              mood={insights.weekly.mostCommonMood.mood}
              tone={insights.weekly.weekStory.tone}
            />

            <GuidanceCard {...insights.weekly.guidanceCard} />

            <View style={styles.statsPanel}>
              {insights.weekly.stats.map((item) => (
                <StatPill
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  caption={item.caption}
                />
              ))}
            </View>

            <CompareCard
              eyebrow="Month to month"
              title={insights.weekly.monthStory.title}
              body={insights.weekly.monthStory.body}
              confidence={insights.weekly.monthComparisonConfidence}
              onPress={openMonthHistory}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader title="What stands out" />

            <View style={styles.grid}>
              {insights.highlights.evidenceCards.map((card) => (
                <SpotlightCard
                  key={`${card.label}-${card.tag}`}
                  label={card.label}
                  title={card.title}
                  detail={card.detail}
                  tone={card.tone}
                  confidence={card.confidence}
                  twoUp={insights.layout.twoUpSpotlights}
                  onPress={() => openTagHistory(card.tag)}
                />
              ))}

              {insights.highlights.contextSpotlight ? (
                <SpotlightCard
                  {...insights.highlights.contextSpotlight}
                  twoUp={insights.layout.twoUpSpotlights}
                  onPress={
                    insights.highlights.strongestContextTarget
                      ? () => openContextHistory(insights.highlights.strongestContextTarget)
                      : null
                  }
                />
              ) : null}
            </View>

            <View style={styles.grid}>
              {insights.highlights.patternCards.map((card) => (
                <PatternCard
                  key={`${card.label}-${card.value}`}
                  label={card.label}
                  value={card.value}
                  detail={card.detail}
                  tone={card.tone}
                  twoUp={insights.layout.twoUpPatterns}
                />
              ))}
            </View>

            <WeekdayRhythmCard items={insights.highlights.weekdayInsights} />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.signalRail}
              decelerationRate="fast"
              snapToInterval={insights.layout.signalCardWidth + spacing.sm}
              snapToAlignment="start"
            >
              {insights.highlights.signalCards.map((card) => (
                <SignalCard
                  key={card.key}
                  title={card.title}
                  signal={card.signal}
                  coverage={card.coverage}
                  confidence={card.confidence}
                  cardWidth={insights.layout.signalCardWidth}
                  onPress={card.target ? () => openContextHistory(card.target) : null}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Breakdown" />

            <MoodMixStripCard
              title="Mood mix this week"
              summary={insights.breakdown.weekSummary}
            />

            <View style={styles.grid}>
              <MoodMixCard
                title="This month"
                summary={insights.breakdown.monthSummary}
                compact={insights.layout.twoUpDetails}
              />
              <TagListCard
                topTags={insights.breakdown.topTags}
                hardDayTags={insights.breakdown.hardDayTags}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
