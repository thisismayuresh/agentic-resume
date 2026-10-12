import { Injectable } from '@nestjs/common';
import type { RoastReport } from '@app/resume';
import { AgentFailedError, AppException } from '@app/shared';
import type { BuildResumeInput } from './build-resume.command';
import { BuildResumeCommand } from './build-resume.command';
import type { BuilderResult } from './builder/builder.types';
import type { RoastResumeInput } from './roast-resume.command';
import { RoastResumeCommand } from './roast-resume.command';
import { logAgentRun, logUnexpectedAgentError } from './run-log';

@Injectable()
export class AgentOrchestrator {
  constructor(
    private readonly buildResume: BuildResumeCommand,
    private readonly roastResume: RoastResumeCommand,
  ) {}

  async runChat(input: BuildResumeInput): Promise<BuilderResult> {
    const startedAt = Date.now();
    try {
      const result = await this.buildResume.execute(input);
      logAgentRun(
        'resume-builder',
        startedAt,
        `ok, ${result.ops.length} edit ops`,
      );
      return result;
    } catch (error) {
      throw this.reportFailure('resume-builder', startedAt, error);
    }
  }

  async runRoast(input: RoastResumeInput): Promise<RoastReport> {
    const startedAt = Date.now();
    try {
      const report = await this.roastResume.execute(input);
      logAgentRun('resume-review', startedAt, `ok, rating ${report.rating}/10`);
      return report;
    } catch (error) {
      throw this.reportFailure('resume-review', startedAt, error);
    }
  }

  private reportFailure(
    agentName: string,
    startedAt: number,
    error: unknown,
  ): unknown {
    if (error instanceof AppException) {
      logAgentRun(agentName, startedAt, `stopped: ${error.code}`);
      return error;
    }
    logUnexpectedAgentError(agentName, error);
    return new AgentFailedError(
      'The resume agent could not finish this run. Please try again in a moment.',
    );
  }
}
