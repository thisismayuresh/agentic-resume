import { Logger } from '@nestjs/common';

const agentLogger = new Logger('AgentRun');

export function logAgentRun(
  agentName: string,
  startedAt: number,
  outcome: string,
): void {
  const duration = Date.now() - startedAt;
  agentLogger.log(`${agentName} finished in ${duration} ms — ${outcome}`);
}

export function logUnexpectedAgentError(
  agentName: string,
  error: unknown,
): void {
  if (error instanceof Error) {
    agentLogger.error(
      `${agentName} hit an unexpected error: ${error.message}`,
      error.stack,
    );
    return;
  }
  agentLogger.error(`${agentName} hit an unexpected error.`);
}
