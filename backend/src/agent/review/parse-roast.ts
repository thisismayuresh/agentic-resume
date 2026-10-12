import type { RoastReport } from '@app/resume';
import {
  ModelOutputError,
  readArray,
  readNumber,
  readString,
  toRecord,
} from '@app/shared';
import { parseStrictJson } from '@app/shared';

const STRUCTURE_MESSAGE =
  'The review reply did not match the report structure, so nothing was shown. Please try again.';

const SEVERITIES = ['high', 'medium', 'low'];
const IMPACTS = ['high', 'medium', 'low'];

function readStringArray(
  record: Record<string, unknown>,
  key: string,
): string[] {
  const values = readArray(record, key);
  if (values === null) {
    throw new ModelOutputError(STRUCTURE_MESSAGE);
  }
  const items: string[] = [];
  for (const value of values) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new ModelOutputError(STRUCTURE_MESSAGE);
    }
    items.push(value);
  }
  return items;
}

function readSeverity(value: unknown): 'high' | 'medium' | 'low' {
  if (typeof value !== 'string' || !SEVERITIES.includes(value)) {
    throw new ModelOutputError(STRUCTURE_MESSAGE);
  }
  return value as 'high' | 'medium' | 'low';
}

function readRedFlags(
  record: Record<string, unknown>,
): RoastReport['redFlags'] {
  const values = readArray(record, 'redFlags');
  if (values === null) {
    throw new ModelOutputError(STRUCTURE_MESSAGE);
  }
  const redFlags: RoastReport['redFlags'] = [];
  for (const value of values) {
    const flag = toRecord(value);
    if (!flag) {
      throw new ModelOutputError(STRUCTURE_MESSAGE);
    }
    const title = readString(flag, 'title');
    const why = readString(flag, 'why');
    if (!title || !why) {
      throw new ModelOutputError(STRUCTURE_MESSAGE);
    }
    redFlags.push({ title, severity: readSeverity(flag.severity), why });
  }
  return redFlags;
}

function readFixes(record: Record<string, unknown>): RoastReport['fixes'] {
  const values = readArray(record, 'fixes');
  if (values === null) {
    throw new ModelOutputError(STRUCTURE_MESSAGE);
  }
  const fixes: RoastReport['fixes'] = [];
  for (const value of values) {
    const fix = toRecord(value);
    if (!fix) {
      throw new ModelOutputError(STRUCTURE_MESSAGE);
    }
    const suggestion = readString(fix, 'suggestion');
    if (!suggestion) {
      throw new ModelOutputError(STRUCTURE_MESSAGE);
    }
    const impact = fix.impact;
    if (typeof impact !== 'string' || !IMPACTS.includes(impact)) {
      throw new ModelOutputError(STRUCTURE_MESSAGE);
    }
    const rewrite = readString(fix, 'rewrite');
    const entry: RoastReport['fixes'][number] = {
      impact: impact as 'high' | 'medium' | 'low',
      suggestion,
    };
    if (rewrite !== null) {
      entry.rewrite = rewrite;
    }
    fixes.push(entry);
  }
  return fixes;
}

export function parseRoastReport(raw: string): RoastReport {
  const parsed = parseStrictJson(raw, 'resume review');
  const record = toRecord(parsed);
  if (!record) {
    throw new ModelOutputError(STRUCTURE_MESSAGE);
  }

  const rating = readNumber(record, 'rating');
  const verdict = readString(record, 'verdict');
  if (rating === null || rating < 1 || rating > 10 || !verdict) {
    throw new ModelOutputError(STRUCTURE_MESSAGE);
  }

  return {
    rating,
    verdict,
    redFlags: readRedFlags(record),
    criticalFlaws: readStringArray(record, 'criticalFlaws'),
    strengths: readStringArray(record, 'strengths'),
    fixes: readFixes(record),
  };
}
