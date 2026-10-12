import { Inject, Injectable, Logger } from '@nestjs/common';
import { GuardrailsService } from '@app/guardrails';
import { LLM_CLIENT, type LlmClient } from '@app/llm';
import type { Session } from '@app/sessions';
import { logStep } from '../step-log';
import type { BuilderResult } from './builder.types';
import { checkDraft } from './steps/check.step';
import { draftResume } from './steps/draft.step';
import { emitOperations } from './steps/emit.step';
import { gatherContext } from './steps/gather.step';
import { planSections } from './steps/plan.step';

export interface BuilderRunInput {
  session: Session;
  userMessage: string;
  onAssistantText: (text: string) => void;
  signal?: AbortSignal;
}

@Injectable()
export class ResumeBuilderAgent {
  private readonly logger = new Logger(ResumeBuilderAgent.name);

  constructor(
    @Inject(LLM_CLIENT) private readonly llm: LlmClient,
    private readonly guardrails: GuardrailsService,
  ) {}

  async run(input: BuilderRunInput): Promise<BuilderResult> {
    const gatherStarted = Date.now();
    const context = gatherContext(input.session, input.userMessage);
    logStep(
      this.logger,
      'gather',
      `session ${context.sessionId}`,
      `${context.resumeText.length} chars of resume content`,
      gatherStarted,
    );

    const planStarted = Date.now();
    const plan = planSections(context);
    logStep(
      this.logger,
      'plan',
      'job description and resume',
      `section order: ${plan.sectionOrder.join(' -> ')}`,
      planStarted,
    );

    const draftStarted = Date.now();
    const raw = await draftResume(
      this.llm,
      context,
      plan,
      { onAssistantText: input.onAssistantText },
      input.signal,
    );
    logStep(
      this.logger,
      'draft',
      'context prompt',
      `${raw.length} chars of model output`,
      draftStarted,
    );

    const checkStarted = Date.now();
    const checked = checkDraft(raw, context, this.guardrails);
    logStep(
      this.logger,
      'check',
      `${checked.ops.length} parsed edits`,
      `${checked.warnings.length} guardrail warnings`,
      checkStarted,
    );

    const emitStarted = Date.now();
    const result = emitOperations(checked, context);
    logStep(
      this.logger,
      'emit',
      'edits validated against the live resume',
      `${result.ops.length} edits kept`,
      emitStarted,
    );
    return result;
  }
}
