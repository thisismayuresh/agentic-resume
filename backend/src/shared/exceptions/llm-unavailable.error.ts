import { AppException } from './app.exception';

export class LlmUnavailableError extends AppException {
  readonly code = 'llm_unavailable';

  constructor(message: string) {
    super(message);
  }
}
