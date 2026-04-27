import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const REMINDER_IDENTIFIER = "daily-mood-reminder";
const ANDROID_CHANNEL_ID = "daily-mood-reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function parseTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return {
    hours: hours ?? 20,
    minutes: minutes ?? 0,
  };
}

export async function ensureReminderPermissionsAsync() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return requested.granted;
}

async function configureAndroidChannelAsync() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Daily mood reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 150, 120, 150],
    lightColor: "#AFC2FF",
  });
}

export async function cancelDailyMoodReminderAsync() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminderIds = scheduled
    .filter((item) => item.identifier === REMINDER_IDENTIFIER)
    .map((item) => item.identifier);

  for (const id of reminderIds) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}

export async function scheduleDailyMoodReminderAsync(time: string) {
  const granted = await ensureReminderPermissionsAsync();
  if (!granted) return false;

  await configureAndroidChannelAsync();
  await cancelDailyMoodReminderAsync();

  const { hours, minutes } = parseTime(time);

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content: {
      title: "Mood check-in",
      body: "Take a moment to log how your day feels.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
      channelId: Platform.OS === "android" ? ANDROID_CHANNEL_ID : undefined,
    },
  });

  return true;
}
