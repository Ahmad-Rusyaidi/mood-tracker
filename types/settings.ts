export type ReminderSettings = {
  enabled: boolean;
  time: string;
};

export type AppSettings = {
  customTags: string[];
  reminders: ReminderSettings;
};
