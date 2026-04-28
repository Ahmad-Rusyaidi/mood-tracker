import { toISODateLocal } from "@/utils";
import {
  getMoodFromReminderAction,
  isDailyMoodReminderNotification,
  registerDailyReminderCategoryAsync,
  syncMoodReminderScheduleAsync,
} from "@/utils/reminders";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import "react-native-reanimated";

import { useMoodEntries } from "@/hooks";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

function useReminderNotificationObserver() {
  const { setMoodForDate } = useMoodEntries();
  const handledResponseKeysRef = useRef(new Set<string>());

  useEffect(() => {
    let isActive = true;

    const handleResponse = async (
      response: Notifications.NotificationResponse | null
    ) => {
      if (!response?.notification) return;

      const responseKey = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      if (handledResponseKeysRef.current.has(responseKey)) return;
      handledResponseKeysRef.current.add(responseKey);

      const notification = response.notification;
      if (!isDailyMoodReminderNotification(notification)) return;

      const requestedDate = notification.request.content.data?.targetDate;
      const targetDate =
        typeof requestedDate === "string"
          ? requestedDate
          : toISODateLocal(new Date(notification.date));
      const mood = getMoodFromReminderAction(response.actionIdentifier);

      if (mood) {
        await setMoodForDate(targetDate, mood);
      }

      if (!isActive) return;

      router.push({
        pathname: "/",
        params: {
          date: targetDate,
          view: "day",
        },
      });

      await Notifications.clearLastNotificationResponseAsync();
    };

    void registerDailyReminderCategoryAsync();
    void syncMoodReminderScheduleAsync({ requestPermissions: false });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      void handleResponse(response);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      void handleResponse(response);
    });
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void syncMoodReminderScheduleAsync({ requestPermissions: false });
      }
    });

    return () => {
      isActive = false;
      subscription.remove();
      appStateSubscription.remove();
    };
  }, [setMoodForDate]);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useReminderNotificationObserver();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
