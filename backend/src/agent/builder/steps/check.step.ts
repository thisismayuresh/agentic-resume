import type { GuardrailsService } from '@app/guardrails';
import type { CheckedDraft } from '@app/guardrails';
import {
  InvalidOpError,
  ModelOutputError,
  readArray,
  readString,
  toRecord,
} from '@app/shared';
import { parseStrictJson } from '@app/shared';
import { parseResumeOps } from '@app/resume';
import type { BuildContext } from '../builder.types';

const BAD_SHAPE_MESSAGE =
  'The resume builder reply was missing its text or edits, so nothing was applied. Please try again.';

function readDraftShape(raw: string): {
  assistantText: string;
  rawOps: unknown[];
} {
  const parsed = parseStrictJson(raw, 'resume builder');
  const record = toRecord(parsed);
  if (!record) {
    throw new ModelOutputError(BAD_SHAPE_MESSAGE);
  }
  const assistantText = readString(record, 'text');
  const rawOps = readArray(record, 'ops');
  if (assistantText === null || rawOps === null) {
    throw new ModelOutputError(BAD_SHAPE_MESSAGE);
  }
  return { assistantText, rawOps };
}

export function checkDraft(
  raw: string,
  context: BuildContext,
  guardrails: GuardrailsService,
): CheckedDraft {
  const { assistantText, rawOps } = readDraftShape(raw);

  let assistantOps;
  try {
    assistantOps = parseResumeOps(rawOps);
  } catch (error) {
    if (error instanceof InvalidOpError) {
      throw new ModelOutputError(
        'The resume builder returned an edit the app could not apply. Please try again.',
      );
    }
    throw error;
  }

  return guardrails.checkDraft(
    { assistantText, ops: assistantOps },
    context.sourceText,
  );
}
