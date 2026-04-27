export const REMINDER_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export type ReminderWeekday = (typeof REMINDER_WEEKDAYS)[number];

export type ReminderSettings = {
  enabled: boolean;
  time: string;
  weekdays: ReminderWeekday[];
  skipIfLogged: boolean;
};

export type AppSettings = {
  customTags: string[];
  reminders: ReminderSettings;
};
