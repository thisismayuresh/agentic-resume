import { AppException } from './app.exception';

export class InsufficientCreditsError extends AppException {
  readonly code = 'insufficient_credits';

  constructor(required: number, available: number) {
    super(
      `This action needs ${required} credits but the account has ${available}. Come back tomorrow for the daily bonus.`,
    );
  }
}
