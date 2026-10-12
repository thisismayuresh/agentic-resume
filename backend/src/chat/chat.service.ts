import { Injectable, Logger } from '@nestjs/common';
import { AgentOrchestrator, type BuilderResult } from '@app/agent';
import { ResumeService } from '@app/resume';
import type { Session } from '@app/sessions';
import { SessionsService } from '@app/sessions';
import { AppException, GuardrailViolationError } from '@app/shared';
import { SseEmitter } from './sse-emitter';

export interface ChatMessageInput {
  session: Session;
  message: string;
  emitter: SseEmitter;
  signal?: AbortSignal;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly sessions: SessionsService,
    private readonly orchestrator: AgentOrchestrator,
    private readonly resumeService: ResumeService,
  ) {}

  async runMessage(input: ChatMessageInput): Promise<void> {
    try {
      const result = await this.orchestrator.runChat({
        session: input.session,
        userMessage: input.message,
        signal: input.signal,
        onAssistantText: (text: string) => input.emitter.assistant(text),
      });
      this.publishResult(input.session, result, input.emitter);
    } catch (error) {
      this.publishFailure(error, input.emitter);
    }
  }

  private publishResult(
    session: Session,
    result: BuilderResult,
    emitter: SseEmitter,
  ): void {
    const updatedResume = this.resumeService.apply(session.resume, result.ops);
    this.sessions.updateResume(session.sessionId, updatedResume);

    if (result.warnings.length > 0) {
      this.sessions.addWarnings(session.sessionId, result.warnings);
    }
    if (!emitter.hasAssistantText()) {
      emitter.assistant(result.assistantText);
    }
    for (const op of result.ops) {
      emitter.op(op);
    }
    for (const warning of result.warnings) {
      emitter.warning(warning);
    }
    emitter.done();
  }

  private publishFailure(error: unknown, emitter: SseEmitter): void {
    if (emitter.isClosed()) {
      return;
    }
    if (error instanceof GuardrailViolationError) {
      emitter.assistant(error.message);
      emitter.warning({ code: error.reason, message: error.message });
      emitter.done();
      return;
    }
    if (error instanceof AppException) {
      emitter.error(error.code, error.message);
      return;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      emitter.close();
      return;
    }
    this.logUnexpected(error);
    emitter.error(
      'internal_error',
      'Something went wrong while running the agent. Please try again.',
    );
  }

  private logUnexpected(error: unknown): void {
    if (error instanceof Error) {
      this.logger.error(`${error.name}: ${error.message}`, error.stack);
      return;
    }
    this.logger.error('An unknown error ended the chat run.');
  }
}
