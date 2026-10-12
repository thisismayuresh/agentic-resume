import { ModelOutputError } from '../exceptions/index';

function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }
  const withoutOpening = trimmed.replace(/^```[a-zA-Z]*\n?/, '');
  return withoutOpening.replace(/\n?```$/, '').trim();
}

function parseJsonCandidate(candidate: string): unknown {
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

export function parseStrictJson(raw: string, sourceLabel: string): unknown {
  const cleaned = stripCodeFence(raw);
  const direct = parseJsonCandidate(cleaned);
  if (direct !== null) {
    return direct;
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const embedded = parseJsonCandidate(
      cleaned.slice(firstBrace, lastBrace + 1),
    );
    if (embedded !== null) {
      return embedded;
    }
  }

  throw new ModelOutputError(
    `The ${sourceLabel} reply was not valid JSON, so the run stopped before any edit was applied. Please try again.`,
  );
}
