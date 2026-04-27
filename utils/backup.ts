import { appSettingsStorage, getDefaultAppSettings, moodStorage, normalizeAppSettings } from "@/storage";
import { safeJsonParse } from "@/storage";
import { MOODS, type AppSettings, type ContextScale, type Mood, type MoodEntry } from "@/types";

export const BACKUP_SCHEMA_VERSION = 1;

export type BackupPayload = {
  version: number;
  exportedAt: string;
  entries: MoodEntry[];
  settings: AppSettings;
};

type ImportMode = "merge" | "replace";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function isValidMood(value: unknown): value is Mood {
  return typeof value === "string" && MOODS.includes(value as Mood);
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== (month ?? 1) - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return value;
}

function normalizeContextScale(value: unknown): ContextScale | undefined {
  if (typeof value !== "number" || !Number.isInteger(value)) return undefined;
  if (value < 1 || value > 5) return undefined;
  return value as ContextScale;
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return undefined;

  const tags = Array.from(
    new Set(
      value
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  return tags.length > 0 ? tags : undefined;
}

function normalizeEntry(value: unknown): MoodEntry | null {
  if (!isRecord(value)) return null;

  const date = normalizeDate(value.date);
  const mood = value.mood;

  if (!date || !isValidMood(mood)) return null;

  const createdAt =
    typeof value.createdAt === "number" && Number.isFinite(value.createdAt)
      ? value.createdAt
      : Date.now();
  const updatedAt =
    typeof value.updatedAt === "number" && Number.isFinite(value.updatedAt)
      ? value.updatedAt
      : createdAt;
  const note =
    typeof value.note === "string" && value.note.trim().length > 0 ? value.note : undefined;
  const tags = normalizeTags(value.tags);
  const energy = normalizeContextScale(value.energy);
  const stress = normalizeContextScale(value.stress);
  const sleep = normalizeContextScale(value.sleep);

  return {
    date,
    mood,
    createdAt,
    updatedAt,
    ...(note ? { note } : {}),
    ...(tags ? { tags } : {}),
    ...(energy ? { energy } : {}),
    ...(stress ? { stress } : {}),
    ...(sleep ? { sleep } : {}),
  };
}

function normalizeEntries(value: unknown): MoodEntry[] {
  if (!Array.isArray(value)) {
    throw new Error("Backup is missing its entries array.");
  }

  const entries = value.map(normalizeEntry).filter((entry): entry is MoodEntry => entry != null);
  if (entries.length !== value.length) {
    throw new Error("Backup contains one or more invalid mood entries.");
  }

  return entries;
}

export async function exportBackupPayloadAsync(): Promise<BackupPayload> {
  return {
    version: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    entries: await moodStorage.getAll(),
    settings: await appSettingsStorage.getAll(),
  };
}

export function buildBackupFilename(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `mood-tracker-backup-${year}-${month}-${day}-${hours}${minutes}.json`;
}

export function parseBackupPayload(value: string): BackupPayload {
  const parsed = safeJsonParse<unknown>(value);
  if (!isRecord(parsed)) {
    throw new Error("Backup text is not valid JSON.");
  }

  const exportedAt =
    typeof parsed.exportedAt === "string" && !Number.isNaN(Date.parse(parsed.exportedAt))
      ? parsed.exportedAt
      : new Date().toISOString();

  return {
    version:
      typeof parsed.version === "number" && Number.isFinite(parsed.version)
        ? parsed.version
        : BACKUP_SCHEMA_VERSION,
    exportedAt,
    entries: normalizeEntries(parsed.entries),
    settings: normalizeAppSettings(parsed.settings ?? getDefaultAppSettings()),
  };
}

export async function importBackupPayloadAsync(value: string, mode: ImportMode) {
  const payload = parseBackupPayload(value);

  if (mode === "replace") {
    const restoredEntries = await moodStorage.replaceAll(payload.entries);
    const restoredSettings = await appSettingsStorage.replaceAll(payload.settings);

    return {
      mode,
      entryCount: restoredEntries.length,
      customTagCount: restoredSettings.customTags.length,
    };
  }

  const currentEntries = await moodStorage.getAll();
  const mergedMap = new Map(currentEntries.map((entry) => [entry.date, entry]));

  for (const entry of payload.entries) {
    const existing = mergedMap.get(entry.date);
    if (!existing || entry.updatedAt >= existing.updatedAt) {
      mergedMap.set(entry.date, entry);
    }
  }

  const mergedEntries = await moodStorage.replaceAll([...mergedMap.values()]);
  const currentSettings = await appSettingsStorage.getAll();
  const mergedSettings = await appSettingsStorage.replaceAll({
    ...currentSettings,
    customTags: Array.from(
      new Set([...currentSettings.customTags, ...payload.settings.customTags])
    ).sort((a, b) => a.localeCompare(b)),
  });

  return {
    mode,
    entryCount: mergedEntries.length,
    customTagCount: mergedSettings.customTags.length,
  };
}
