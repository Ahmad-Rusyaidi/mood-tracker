//storage/json.ts
export function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function toJson(value: unknown): string {
  return JSON.stringify(value);
}
