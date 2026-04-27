import { appSettingsStorage, moodStorage } from "@/storage";
import type { Mood, ReminderSettings, ReminderWeekday } from "@/types";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { toISODateLocal } from "./date";
import { parseReminderTime } from "./reminderTime";

const REMINDER_IDENTIFIER = "daily-mood-reminder";
const REMINDER_LOOKAHEAD_DAYS = 28;
const ANDROID_CHANNEL_ID = "daily-mood-reminders";
const DAILY_REMINDER_CATEGORY_ID = "dailyMoodQuickLog";

export const REMINDER_WEEKDAY_OPTIONS: ReadonlyArray<{
  value: ReminderWeekday;
  label: string;
  shortLabel: string;
}> = [
  { value: 0, label: "Sunday", shortLabel: "Sun" },
  { value: 1, label: "Monday", shortLabel: "Mon" },
  { value: 2, label: "Tuesday", shortLabel: "Tue" },
  { value: 3, label: "Wednesday", shortLabel: "Wed" },
  { value: 4, label: "Thursday", shortLabel: "Thu" },
  { value: 5, label: "Friday", shortLabel: "Fri" },
  { value: 6, label: "Saturday", shortLabel: "Sat" },
] as const;

const QUICK_LOG_ACTIONS: ReadonlyArray<{
  actionId: string;
  mood: Mood;
  label: string;
}> = [
  { actionId: "quick_log_happy", mood: "happy", label: "Happy" },
  { actionId: "quick_log_neutral", mood: "neutral", label: "Okay" },
  { actionId: "quick_log_sad", mood: "sad", label: "Sad" },
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getReminderIdentifierForDate(date: string) {
  return `${REMINDER_IDENTIFIER}:${date}`;
}

function isReminderIdentifier(identifier: string) {
  return identifier === REMINDER_IDENTIFIER || identifier.startsWith(`${REMINDER_IDENTIFIER}:`);
}

function buildReminderTriggerDate(baseDate: Date, time: string) {
  const { hours, minutes } = parseReminderTime(time);
  const triggerDate = new Date(baseDate);
  triggerDate.setHours(hours, minutes, 0, 0);
  return triggerDate;
}

export async function ensureReminderPermissionsAsync(requestIfNeeded = true) {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!requestIfNeeded) return false;

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

export async function registerDailyReminderCategoryAsync() {
  await Notifications.setNotificationCategoryAsync(
    DAILY_REMINDER_CATEGORY_ID,
    QUICK_LOG_ACTIONS.map((action) => ({
      identifier: action.actionId,
      buttonTitle: action.label,
      options: {
        opensAppToForeground: true,
      },
    }))
  );
}

export function getMoodFromReminderAction(actionIdentifier: string): Mood | null {
  const action = QUICK_LOG_ACTIONS.find((item) => item.actionId === actionIdentifier);
  return action?.mood ?? null;
}

export function isDailyMoodReminderNotification(notification: Notifications.Notification) {
  return notification.request.content.data?.source === REMINDER_IDENTIFIER;
}

export async function cancelDailyMoodReminderAsync() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminderIds = scheduled
    .filter((item) => isReminderIdentifier(item.identifier))
    .map((item) => item.identifier);

  for (const id of reminderIds) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}

export async function syncMoodReminderScheduleAsync(options?: {
  requestPermissions?: boolean;
  settings?: ReminderSettings;
}) {
  const settings = options?.settings ?? (await appSettingsStorage.getAll()).reminders;

  if (!settings.enabled) {
    await cancelDailyMoodReminderAsync();
    return true;
  }

  const granted = await ensureReminderPermissionsAsync(options?.requestPermissions ?? false);
  if (!granted) return false;

  await configureAndroidChannelAsync();
  await registerDailyReminderCategoryAsync();
  await cancelDailyMoodReminderAsync();

  const loggedDates = new Set((await moodStorage.getAll()).map((entry) => entry.date));
  const now = new Date();

  for (let offset = 0; offset < REMINDER_LOOKAHEAD_DAYS; offset += 1) {
    const candidateDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset
    );
    const weekday = candidateDate.getDay() as ReminderWeekday;

    if (!settings.weekdays.includes(weekday)) continue;

    const triggerDate = buildReminderTriggerDate(candidateDate, settings.time);
    if (triggerDate <= now) continue;

    const targetDate = toISODateLocal(triggerDate);
    if (settings.skipIfLogged && loggedDates.has(targetDate)) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: getReminderIdentifierForDate(targetDate),
      content: {
        title: "Mood check-in",
        body: "Tap a quick mood or open the app for a fuller reflection.",
        sound: true,
        categoryIdentifier: DAILY_REMINDER_CATEGORY_ID,
        data: {
          source: REMINDER_IDENTIFIER,
          targetDate,
          view: "day",
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: Platform.OS === "android" ? ANDROID_CHANNEL_ID : undefined,
      },
    });
  }

  return true;
}
