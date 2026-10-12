import { Module } from '@nestjs/common';
import { GuardrailsModule } from '@app/guardrails';
import { LlmModule } from '@app/llm';
import { SessionsModule } from '@app/sessions';
import { AgentOptionsController } from './agent-options.controller';
import { AgentOrchestrator } from './agent.orchestrator';
import { BuildResumeCommand } from './build-resume.command';
import { ResumeBuilderAgent } from './builder/resume-builder.agent';
import { RoastResumeCommand } from './roast-resume.command';
import { ResumeReviewAgent } from './review/resume-review.agent';

@Module({
  imports: [SessionsModule, LlmModule, GuardrailsModule],
  controllers: [AgentOptionsController],
  providers: [
    ResumeBuilderAgent,
    ResumeReviewAgent,
    BuildResumeCommand,
    RoastResumeCommand,
    AgentOrchestrator,
  ],
  exports: [AgentOrchestrator],
})
export class AgentModule {}
