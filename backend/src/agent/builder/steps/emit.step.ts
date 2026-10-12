import type { CheckedDraft } from '@app/guardrails';
import { applyOps } from '@app/resume';
import type {
  ResumeDocument,
  ResumeOp,
  Warning,
} from '@app/resume';
import type { BuildContext, BuilderResult } from '../builder.types';

const SKIPPED_OP_WARNING: Warning = {
  code: 'op_skipped',
  message: 'I skipped an edit that did not fit the current resume.',
};

function insertsExistingSection(op: ResumeOp, resume: ResumeDocument): boolean {
  if (op.type !== 'insertSection') {
    return false;
  }
  return resume.sections.some((section) => section.id === op.section.id);
}

export function emitOperations(
  checked: CheckedDraft,
  context: BuildContext,
): BuilderResult {
  let working: ResumeDocument = context.resume;
  const usableOps: ResumeOp[] = [];
  let skipped = 0;

  for (const op of checked.ops) {
    if (insertsExistingSection(op, working)) {
      skipped += 1;
      continue;
    }
    try {
      working = applyOps(working, [op]);
      usableOps.push(op);
    } catch {
      skipped += 1;
    }
  }

  const warnings = [...checked.warnings];
  if (skipped > 0) {
    warnings.push(SKIPPED_OP_WARNING);
  }
  return { assistantText: checked.assistantText, ops: usableOps, warnings };
}
