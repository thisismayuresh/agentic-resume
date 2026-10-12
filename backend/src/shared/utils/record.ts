export function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function readString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  if (typeof value !== 'string') {
    return null;
  }
  return value;
}

export function readArray(
  record: Record<string, unknown>,
  key: string,
): unknown[] | null {
  const value = record[key];
  if (!Array.isArray(value)) {
    return null;
  }
  return value;
}

export function readNumber(
  record: Record<string, unknown>,
  key: string,
): number | null {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return value;
}
