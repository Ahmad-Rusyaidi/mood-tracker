import { HistoryEntryCard } from "@/components/history/HistoryEntryCard";
import { HistoryFilters } from "@/components/history/HistoryFilters";
import { useHistoryScreen } from "@/hooks";
import { styles } from "@/styles/history.styles";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function JournalScreen() {
  const router = useRouter();
  const screen = useHistoryScreen();

  return (
    <SafeAreaView style={styles.container}>
      {screen.isLoading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Loading your history...</Text>
          <Text style={styles.stateText}>
            Pulling together your saved check-ins.
          </Text>
        </View>
      ) : !screen.hasEntries ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>No entries yet</Text>
          <Text style={styles.stateText}>
            Start logging moods on the Home tab and your reflections will appear
            here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={screen.filteredEntries}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <HistoryFilters
              searchQuery={screen.searchQuery}
              onChangeSearchQuery={screen.setSearchQuery}
              selectedMood={screen.selectedMood}
              onSelectMood={screen.setSelectedMood}
              selectedMonth={screen.selectedMonth}
              onSelectMonth={screen.setSelectedMonth}
              monthOptions={screen.monthOptions}
              selectedTag={screen.selectedTag}
              onSelectTag={screen.setSelectedTag}
              tagOptions={screen.tagOptions}
              selectedContext={screen.selectedContext}
              onSelectContext={screen.setSelectedContext}
              filteredCount={screen.filteredEntries.length}
              entryLabel={screen.entryLabel}
              hasFilters={screen.hasFilters}
            />
          }
          renderItem={({ item }) => (
            <HistoryEntryCard
              entry={item}
              onEdit={() =>
                router.push({
                  pathname: "/",
                  params: { date: item.date, view: "day" },
                })
              }
              onDelete={() => screen.handleDeleteEntry(item.date)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyResults}>
              <Text style={styles.stateTitle}>No matching entries</Text>
              <Text style={styles.stateText}>
                Try a different mood, month, or tag filter to widen the results.
              </Text>
              {screen.hasFilters ? (
                <Pressable onPress={screen.clearFilters} style={styles.resetButton}>
                  <Text style={styles.resetButtonText}>Clear filters</Text>
                </Pressable>
              ) : null}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
