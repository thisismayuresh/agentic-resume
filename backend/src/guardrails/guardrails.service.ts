import { Injectable } from '@nestjs/common';
import type { ResumeOp, Warning } from '@app/resume';
import { GuardrailViolationError } from '@app/shared';
import { classifyUserMessage } from './classify-input';
import { classifyDocumentText } from './classify-document';
import { scanText } from './check-output';
import { scanOps } from './scan-ops';
import {
  pickDocumentTaunt,
  REFUSAL_COPY,
  UNSUPPORTED_CLAIM_WARNING,
  NEUTRAL_UPDATE_MESSAGE,
} from './refusal-copy';

export interface DraftToCheck {
  assistantText: string;
  ops: ResumeOp[];
}

export interface CheckedDraft {
  assistantText: string;
  ops: ResumeOp[];
  warnings: Warning[];
}

@Injectable()
export class GuardrailsService {
  assertInputAllowed(message: string): void {
    const reason = classifyUserMessage(message);
    if (reason === null) {
      return;
    }
    throw new GuardrailViolationError(reason, REFUSAL_COPY[reason]);
  }

  /** Refuses an uploaded document whose text is illicit or fake-credential
   * marketing. The refusal message is a roast-flavored taunt (FR-13 voice). */
  assertDocumentAllowed(text: string, filename: string): void {
    const reason = classifyDocumentText(text);
    if (reason === null) {
      return;
    }
    const taunt = pickDocumentTaunt(reason, `${filename}:${reason}`);
    throw new GuardrailViolationError(reason, taunt);
  }

  checkDraft(draft: DraftToCheck, sourceText: string): CheckedDraft {
    const textScan = scanText(draft.assistantText, sourceText);
    const opsScan = scanOps(draft.ops, sourceText);
    const violations = textScan.violations.length + opsScan.violations.length;

    const checked: CheckedDraft = {
      assistantText: textScan.text,
      ops: opsScan.ops,
      warnings: [],
    };

    if (
      checked.assistantText.trim().length === 0 &&
      draft.assistantText.trim().length > 0
    ) {
      checked.assistantText = NEUTRAL_UPDATE_MESSAGE;
    }
    if (violations > 0) {
      checked.warnings.push({
        code: 'fabricated_credentials',
        message: UNSUPPORTED_CLAIM_WARNING,
      });
    }
    return checked;
  }
}
