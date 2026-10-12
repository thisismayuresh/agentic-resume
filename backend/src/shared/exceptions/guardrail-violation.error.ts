import { AppException } from './app.exception';

export class GuardrailViolationError extends AppException {
  readonly code = 'guardrail_violation';

  constructor(
    readonly reason: string,
    message: string,
  ) {
    super(message);
  }
}
