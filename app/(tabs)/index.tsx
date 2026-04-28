import { HomeMonthPanel } from "@/components/home/HomeMonthPanel";
import { HomeViewToggle } from "@/components/home/HomeViewToggle";
import { DayCalendar } from "@/components/mood/DayCalendar";
import { WeekCalendar } from "@/components/mood/WeekCalendar";
import { useHomeScreen } from "@/hooks";
import { styles } from "@/styles/home.styles";
import { parseISODateLocal } from "@/utils/home";
import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const screen = useHomeScreen();

  return (
    <SafeAreaView style={styles.container}>
      <HomeViewToggle
        pillWidth={screen.pillWidth}
        indicatorX={screen.indicatorX}
        viewMode={screen.viewMode}
        onSelectViewMode={screen.setViewMode}
      />

      <View style={styles.calendarArea}>
        {screen.viewMode === "month" ? (
          <HomeMonthPanel
            month={screen.month}
            selectedDate={screen.selectedDate}
            entriesMap={screen.map}
            filtersOpen={screen.filtersOpen}
            activeFilterCount={screen.activeFilterCount}
            filters={screen.filters}
            onToggleFilters={() => screen.setFiltersOpen((value) => !value)}
            onChangeFilters={screen.setFilters}
            onChangeMonth={screen.setMonth}
            onSelectDate={screen.handleSelectDateFromMonth}
            dimDay={screen.dimDay}
          />
        ) : null}

        {screen.viewMode === "week" ? (
          <WeekCalendar
            anchorDate={parseISODateLocal(screen.selectedDate)}
            selectedDate={screen.selectedDate}
            entriesMap={screen.map}
            onNavigateWeek={screen.navigateWeek}
            onJumpToToday={screen.jumpToToday}
            onSelectDate={screen.selectDateAndOpenDay}
          />
        ) : null}

        {screen.viewMode === "day" ? (
          <DayCalendar
            selectedDate={screen.selectedDate}
            entry={screen.selectedEntry}
            onChangeMood={(mood) => void screen.setMoodForDate(screen.selectedDate, mood)}
            onChangeTags={(tags) => void screen.setTagsForDate(screen.selectedDate, tags)}
            onChangeContext={(key, value) =>
              void screen.setContextForDate(screen.selectedDate, key, value)
            }
            entriesMap={screen.map}
            availableTags={screen.settings.customTags}
            onCreateCustomTag={(tag) => screen.addCustomTag(tag)}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
