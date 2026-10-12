import { Logger } from '@nestjs/common';

export function logStep(
  logger: Logger,
  step: string,
  inputs: string,
  output: string,
  startedAt: number,
): void {
  const duration = Date.now() - startedAt;
  logger.log(
    `step ${step} — inputs: ${inputs} — output: ${output} — took ${duration} ms`,
  );
}
