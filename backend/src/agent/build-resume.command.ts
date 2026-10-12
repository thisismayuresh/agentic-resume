import { Injectable } from '@nestjs/common';
import { GuardrailsService } from '@app/guardrails';
import type { Session } from '@app/sessions';
import type { Command } from '@app/shared';
import type { BuilderResult } from './builder/builder.types';
import { ResumeBuilderAgent } from './builder/resume-builder.agent';

export interface BuildResumeInput {
  session: Session;
  userMessage: string;
  onAssistantText: (text: string) => void;
  signal?: AbortSignal;
}

@Injectable()
export class BuildResumeCommand implements Command<
  BuildResumeInput,
  BuilderResult
> {
  constructor(
    private readonly guardrails: GuardrailsService,
    private readonly builder: ResumeBuilderAgent,
  ) {}

  async execute(input: BuildResumeInput): Promise<BuilderResult> {
    this.guardrails.assertInputAllowed(input.userMessage);
    return this.builder.run(input);
  }
}
