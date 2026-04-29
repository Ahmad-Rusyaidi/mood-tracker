import { styles } from "@/styles/history.styles";
import type { Mood } from "@/types";
import { moodToEmoji } from "@/utils/moodUi";
import {
  CONTEXT_FILTER_OPTIONS,
  formatMonthLabel,
  type ComboFilter,
  type ContextFilter,
  type MonthFilter,
  type MoodFilter,
} from "@/utils/history";
import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

function FilterChip({
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
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      <Text
        style={[
          styles.chipText,
          active ? styles.chipTextActive : styles.chipTextInactive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function HistoryFilters({
  searchQuery,
  onChangeSearchQuery,
  selectedMood,
  onSelectMood,
  selectedMonth,
  onSelectMonth,
  monthOptions,
  selectedTag,
  onSelectTag,
  tagOptions,
  selectedContext,
  onSelectContext,
  selectedCombo,
  comboLabel,
  onClearCombo,
  filteredCount,
  entryLabel,
  hasFilters,
  sortExplanation,
}: {
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;
  selectedMood: MoodFilter;
  onSelectMood: (mood: MoodFilter) => void;
  selectedMonth: MonthFilter;
  onSelectMonth: (month: MonthFilter) => void;
  monthOptions: string[];
  selectedTag: string | "all";
  onSelectTag: (tag: string | "all") => void;
  tagOptions: string[];
  selectedContext: ContextFilter;
  onSelectContext: (value: ContextFilter) => void;
  selectedCombo: ComboFilter;
  comboLabel: string;
  onClearCombo: () => void;
  filteredCount: number;
  entryLabel: string;
  hasFilters: boolean;
  sortExplanation?: string | null;
}) {
  return (
    <View style={styles.headerWrap}>
      <Text style={styles.title}>Journal</Text>
      <Text style={styles.subtitle}>
        Browse your past check-ins, filter them, and reopen the days behind each
        pattern.
      </Text>

      <TextInput
        value={searchQuery}
        onChangeText={onChangeSearchQuery}
        placeholder="Search tags, moods, or dates"
        placeholderTextColor="rgba(17,24,39,0.35)"
        style={styles.searchInput}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />

      <FilterSection title="Mood">
        <FilterChip
          label="All"
          active={selectedMood === "all"}
          onPress={() => onSelectMood("all")}
        />
        {(["happy", "neutral", "sad", "angry", "anxious"] as const).map(
          (mood: Mood) => (
            <FilterChip
              key={mood}
              label={`${moodToEmoji[mood]} ${mood}`}
              active={selectedMood === mood}
              onPress={() => onSelectMood(mood)}
            />
          )
        )}
      </FilterSection>

      <FilterSection title="Month">
        <FilterChip
          label="All"
          active={selectedMonth === "all"}
          onPress={() => onSelectMonth("all")}
        />
        {monthOptions.map((monthKey) => (
          <FilterChip
            key={monthKey}
            label={formatMonthLabel(monthKey)}
            active={selectedMonth === monthKey}
            onPress={() => onSelectMonth(monthKey)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Tag">
        <FilterChip
          label="All"
          active={selectedTag === "all"}
          onPress={() => onSelectTag("all")}
        />
        {tagOptions.map((tag) => (
          <FilterChip
            key={tag}
            label={`#${tag}`}
            active={selectedTag === tag}
            onPress={() => onSelectTag(tag)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Signal">
        {CONTEXT_FILTER_OPTIONS.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            active={selectedContext === option.value}
            onPress={() => onSelectContext(option.value)}
          />
        ))}
      </FilterSection>

      {selectedCombo !== "all" ? (
        <FilterSection title="Pattern">
          <FilterChip
            label={comboLabel}
            active
            onPress={onClearCombo}
          />
        </FilterSection>
      ) : null}

      <Text style={styles.resultCount}>
        {filteredCount} {entryLabel}
        {hasFilters ? " matching your filters" : " saved"}
      </Text>
      {sortExplanation ? (
        <Text style={styles.sortExplanation}>{sortExplanation}</Text>
      ) : null}
    </View>
  );
}
