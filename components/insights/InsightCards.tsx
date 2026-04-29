import { styles } from "@/styles/insights.styles";
import type { Mood } from "@/types";
import type { ContextCoverage, ContextSignal, WeekWarning } from "@/utils/moodStats";
import { moodToEmoji } from "@/utils/moodUi";
import {
  type AnalysisLensData,
  type AnalysisProfileData,
  type ExperimentCardData,
  type NarrativeSummaryData,
  getSignalConfidenceLine,
  getSignalDeltaText,
  getSignalMeterValue,
  getSignalSummary,
  getSignalVerdictLabel,
  getWarningLabel,
  getWarningTone,
  type GuidanceCardData,
  type HeroTone,
  type PatternCardData,
  type SpotlightCardData,
} from "@/utils/insights";
import React from "react";
import { Pressable, Text, View } from "react-native";

export function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function HeroCard({
  eyebrow,
  title,
  body,
  action,
  mood,
  tone,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action?: string;
  mood?: Mood | null;
  tone: HeroTone;
}) {
  return (
    <View
      style={[
        styles.heroCard,
        tone === "lift" ? styles.heroCardLift : null,
        tone === "care" ? styles.heroCardCare : null,
      ]}
    >
      <View style={styles.heroTopRow}>
        <Text
          style={[
            styles.heroEyebrow,
            tone === "lift" ? styles.heroEyebrowLift : null,
            tone === "care" ? styles.heroEyebrowCare : null,
          ]}
        >
          {eyebrow}
        </Text>
        {mood ? (
          <View style={styles.heroMoodBadge}>
            <Text style={styles.heroMoodEmoji}>{moodToEmoji[mood]}</Text>
            <Text style={styles.heroMoodText}>{mood}</Text>
          </View>
        ) : null}
      </View>

      <Text
        style={[
          styles.heroTitle,
          tone === "lift" ? styles.heroTitleLift : null,
          tone === "care" ? styles.heroTitleCare : null,
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.heroBody,
          tone === "lift" ? styles.heroBodyLift : null,
          tone === "care" ? styles.heroBodyCare : null,
        ]}
      >
        {body}
      </Text>

      {action ? (
        <View
          style={[
            styles.heroActionPill,
            tone === "lift" ? styles.heroActionPillLift : null,
            tone === "care" ? styles.heroActionPillCare : null,
          ]}
        >
          <Text
            style={[
              styles.heroActionText,
              tone === "lift" ? styles.heroActionTextLift : null,
              tone === "care" ? styles.heroActionTextCare : null,
            ]}
          >
            {action}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function GuidanceCard({ eyebrow, title, body, prompt }: GuidanceCardData) {
  return (
    <View style={styles.guidanceCard}>
      <Text style={styles.guidanceEyebrow}>{eyebrow}</Text>
      <Text style={styles.guidanceTitle}>{title}</Text>
      <Text style={styles.guidanceBody}>{body}</Text>
      <View style={styles.promptCard}>
        <Text style={styles.promptLabel}>Try this</Text>
        <Text style={styles.promptText}>{prompt}</Text>
      </View>
    </View>
  );
}

export function AnalysisProfileCard({
  eyebrow,
  title,
  body,
  evidence,
  tone,
}: AnalysisProfileData) {
  return (
    <View
      style={[
        styles.analysisProfileCard,
        tone === "lift" ? styles.analysisProfileCardLift : null,
        tone === "care" ? styles.analysisProfileCardCare : null,
      ]}
    >
      <Text
        style={[
          styles.analysisProfileEyebrow,
          tone === "lift" ? styles.analysisProfileEyebrowLift : null,
          tone === "care" ? styles.analysisProfileEyebrowCare : null,
        ]}
      >
        {eyebrow}
      </Text>
      <Text
        style={[
          styles.analysisProfileTitle,
          tone === "lift" ? styles.analysisProfileTitleLift : null,
          tone === "care" ? styles.analysisProfileTitleCare : null,
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.analysisProfileBody,
          tone === "lift" ? styles.analysisProfileBodyLift : null,
          tone === "care" ? styles.analysisProfileBodyCare : null,
        ]}
      >
        {body}
      </Text>
      <View style={styles.analysisEvidencePill}>
        <Text style={styles.analysisEvidenceText}>{evidence}</Text>
      </View>
    </View>
  );
}

export function NarrativeSummaryCard({
  eyebrow,
  summary,
  focus,
  tone,
  comboTitle,
  comboDetail,
  comboTone,
  actions,
  onComboPress,
  onActionPress,
}: NarrativeSummaryData & {
  onComboPress?: (() => void) | null;
  onActionPress?: ((index: number) => void) | null;
}) {
  return (
    <View
      style={[
        styles.narrativeCard,
        tone === "lift" ? styles.narrativeCardLift : null,
        tone === "care" ? styles.narrativeCardCare : null,
      ]}
    >
      <Text
        style={[
          styles.narrativeEyebrow,
          tone === "lift" ? styles.narrativeEyebrowLift : null,
          tone === "care" ? styles.narrativeEyebrowCare : null,
        ]}
      >
        {eyebrow}
      </Text>
      {comboTitle && comboDetail ? (
        <Pressable
          disabled={!onComboPress}
          onPress={onComboPress ?? undefined}
          style={[
            styles.narrativeComboCard,
            comboTone === "supportive" ? styles.narrativeComboCardSupportive : null,
            comboTone === "challenging" ? styles.narrativeComboCardChallenging : null,
            onComboPress ? styles.narrativeComboCardPressable : null,
          ]}
        >
          <Text style={styles.narrativeComboTitle}>{comboTitle}</Text>
          <Text style={styles.narrativeComboDetail}>{comboDetail}</Text>
          {onComboPress ? <Text style={styles.narrativeComboLink}>Open matching days</Text> : null}
        </Pressable>
      ) : null}
      <Text
        style={[
          styles.narrativeSummary,
          tone === "lift" ? styles.narrativeSummaryLift : null,
          tone === "care" ? styles.narrativeSummaryCare : null,
        ]}
      >
        {summary}
      </Text>
      {actions && actions.length > 0 ? (
        <View style={styles.narrativeActionsRow}>
          {actions.map((action, index) => (
            <Pressable
              key={`${action.kind}-${action.label}-${index}`}
              disabled={!onActionPress}
              onPress={onActionPress ? () => onActionPress(index) : undefined}
              style={styles.narrativeActionChip}
            >
              <Text style={styles.narrativeActionChipText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View
        style={[
          styles.narrativeFocusPill,
          tone === "lift" ? styles.narrativeFocusPillLift : null,
          tone === "care" ? styles.narrativeFocusPillCare : null,
        ]}
      >
        <Text
          style={[
            styles.narrativeFocusLabel,
            tone === "lift" ? styles.narrativeFocusLabelLift : null,
            tone === "care" ? styles.narrativeFocusLabelCare : null,
          ]}
        >
          Main focus
        </Text>
        <Text
          style={[
            styles.narrativeFocusText,
            tone === "lift" ? styles.narrativeFocusTextLift : null,
            tone === "care" ? styles.narrativeFocusTextCare : null,
          ]}
        >
          {focus}
        </Text>
      </View>
    </View>
  );
}

export function AnalysisLensCard({
  label,
  title,
  detail,
  tone,
  twoUp,
}: AnalysisLensData & { twoUp: boolean }) {
  return (
    <View
      style={[
        styles.analysisLensCard,
        twoUp ? styles.halfCard : styles.fullCard,
        tone === "supportive" ? styles.analysisLensCardSupportive : null,
        tone === "challenging" ? styles.analysisLensCardChallenging : null,
      ]}
    >
      <Text style={styles.analysisLensLabel}>{label}</Text>
      <Text style={styles.analysisLensTitle}>{title}</Text>
      <Text style={styles.analysisLensDetail}>{detail}</Text>
    </View>
  );
}

export function ExperimentCard({
  label,
  title,
  detail,
  twoUp,
}: ExperimentCardData & { twoUp: boolean }) {
  return (
    <View
      style={[
        styles.experimentCard,
        twoUp ? styles.halfCard : styles.fullCard,
      ]}
    >
      <Text style={styles.experimentLabel}>{label}</Text>
      <Text style={styles.experimentTitle}>{title}</Text>
      <Text style={styles.experimentDetail}>{detail}</Text>
    </View>
  );
}

export function WarningCard({
  warning,
  onPress,
}: {
  warning: WeekWarning;
  onPress?: (() => void) | null;
}) {
  const tone = getWarningTone(warning);

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress ?? undefined}
      style={[
        styles.warningCard,
        tone === "warm" ? styles.warningCardWarm : styles.warningCardCool,
        onPress ? styles.warningCardPressable : null,
      ]}
    >
      <Text style={styles.warningLabel}>{getWarningLabel(warning)}</Text>
      <Text style={styles.warningTitle}>{warning.title}</Text>
      <Text style={styles.warningDetail}>{warning.detail}</Text>
      {onPress ? <Text style={styles.warningLink}>Open days</Text> : null}
    </Pressable>
  );
}

export function CompareCard({
  eyebrow,
  title,
  body,
  confidence,
  onPress,
}: {
  eyebrow: string;
  title: string;
  body: string;
  confidence?: string;
  onPress?: (() => void) | null;
}) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress ?? undefined}
      style={[styles.compareCard, onPress ? styles.compareCardPressable : null]}
    >
      <Text style={styles.compareEyebrow}>{eyebrow}</Text>
      {confidence ? <Text style={styles.confidenceBadge}>{confidence}</Text> : null}
      <Text style={styles.compareTitle}>{title}</Text>
      <Text style={styles.compareBody}>{body}</Text>

      {onPress ? (
        <View style={styles.compareLinkPill}>
          <Text style={styles.compareLinkText}>View matching days</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function StatPill({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statPillLabel}>{label}</Text>
      <Text style={styles.statPillValue}>{value}</Text>
      {caption ? <Text style={styles.statPillNote}>{caption}</Text> : null}
    </View>
  );
}

export function PatternCard({
  label,
  value,
  detail,
  tone,
  twoUp,
}: PatternCardData & { twoUp: boolean }) {
  return (
    <View
      style={[
        styles.patternCard,
        twoUp ? styles.halfCard : styles.fullCard,
        tone === "cool" ? styles.patternCardCool : null,
        tone === "warm" ? styles.patternCardWarm : null,
      ]}
    >
      <Text style={styles.patternLabel}>{label}</Text>
      <Text style={styles.patternValue}>{value}</Text>
      <Text style={styles.patternDetail}>{detail}</Text>
    </View>
  );
}

export function SpotlightCard({
  label,
  title,
  detail,
  tone,
  confidence,
  onPress,
  twoUp,
}: SpotlightCardData & { onPress?: (() => void) | null; twoUp: boolean }) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress ?? undefined}
      style={[
        styles.spotlightCard,
        twoUp ? styles.halfCard : styles.fullCard,
        tone === "supportive" ? styles.spotlightCardSupportive : null,
        tone === "challenging" ? styles.spotlightCardChallenging : null,
        tone === "neutral" ? styles.spotlightCardNeutral : null,
      ]}
    >
      <Text style={styles.spotlightLabel}>{label}</Text>
      {confidence ? <Text style={styles.confidenceBadge}>{confidence}</Text> : null}
      <Text style={styles.spotlightTitle}>{title}</Text>
      <Text style={styles.spotlightDetail}>{detail}</Text>
      {onPress ? <Text style={styles.spotlightLink}>Open days</Text> : null}
    </Pressable>
  );
}

export function SignalCard({
  title,
  signal,
  coverage,
  confidence,
  onPress,
  cardWidth,
}: {
  title: string;
  signal: ContextSignal | null;
  coverage: ContextCoverage;
  confidence?: string;
  onPress?: (() => void) | null;
  cardWidth: number;
}) {
  const meterValue = getSignalMeterValue(signal);
  const verdictLabel = getSignalVerdictLabel(signal);
  const summary = getSignalSummary(signal, coverage);
  const confidenceLine = getSignalConfidenceLine(confidence, signal, coverage);
  const deltaText = getSignalDeltaText(signal);

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress ?? undefined}
      style={[
        styles.signalCard,
        { width: cardWidth },
        onPress ? styles.signalCardPressable : null,
      ]}
    >
      <View style={styles.signalTopRow}>
        <Text style={styles.signalTitle}>{title}</Text>
        <Text style={styles.signalShift}>{verdictLabel}</Text>
      </View>

      {confidenceLine ? <Text style={styles.signalConfidence}>{confidenceLine}</Text> : null}

      <View style={styles.signalTrack}>
        <View style={styles.signalTrackMid} />
        <View
          style={[
            styles.signalThumb,
            {
              left: `${meterValue * 100}%`,
              backgroundColor:
                signal?.delta != null && signal.delta < 0 ? "#F28B82" : "#7EB6FF",
            },
          ]}
        />
      </View>

      <View style={styles.signalScaleLabels}>
        <Text style={styles.signalScaleLabel}>Lower</Text>
        <Text style={styles.signalScaleLabel}>Higher</Text>
      </View>

      <Text style={styles.signalMetaText}>
        {signal
          ? `${coverage.thisWeekCount} this week / ${signal.lowCount} low / ${signal.highCount} high`
          : `${coverage.thisWeekCount} this week`}
      </Text>

      <Text style={styles.signalSummary}>{summary}</Text>
      <Text style={styles.signalDelta}>{deltaText}</Text>

      {onPress ? <Text style={styles.signalLinkText}>Open days</Text> : null}
    </Pressable>
  );
}
