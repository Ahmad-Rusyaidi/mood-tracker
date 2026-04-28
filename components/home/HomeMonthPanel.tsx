import { MonthCalendar } from "@/components/mood";
import {
  MonthFilters,
  type MonthFiltersState,
} from "@/components/mood/MonthFilters";
import { styles } from "@/styles/mood/index.styles";
import type { MoodEntry } from "@/types";
import React from "react";
import { Pressable, Text, View } from "react-native";

export function HomeMonthPanel({
  month,
  selectedDate,
  entriesMap,
  filtersOpen,
  activeFilterCount,
  filters,
  onToggleFilters,
  onChangeFilters,
  onChangeMonth,
  onSelectDate,
  dimDay,
}: {
  month: Date;
  selectedDate: string;
  entriesMap: Record<string, MoodEntry>;
  filtersOpen: boolean;
  activeFilterCount: number;
  filters: MonthFiltersState;
  onToggleFilters: () => void;
  onChangeFilters: (value: MonthFiltersState) => void;
  onChangeMonth: (month: Date) => void;
  onSelectDate: (date: string) => void;
  dimDay: (date: string) => boolean;
}) {
  return (
    <>
      <View style={styles.filterBar}>
        <Pressable onPress={onToggleFilters} style={styles.filterToggle}>
          <Text style={styles.filterToggleText}>Filters</Text>

          {activeFilterCount > 0 ? (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}

          <Text style={styles.filterToggleText}>{filtersOpen ? "^" : "v"}</Text>
        </Pressable>
      </View>

      {filtersOpen ? (
        <MonthFilters
          month={month}
          entriesMap={entriesMap}
          selectedDate={selectedDate}
          value={filters}
          onChange={onChangeFilters}
        />
      ) : null}

      <MonthCalendar
        month={month}
        selectedDate={selectedDate}
        entriesMap={entriesMap}
        onChangeMonth={onChangeMonth}
        onSelectDate={onSelectDate}
        dimDay={dimDay}
        variant="pastel"
        size="normal"
      />
    </>
  );
}
