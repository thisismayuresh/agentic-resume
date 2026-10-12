import { AppException } from './app.exception';

export class SessionNotFoundError extends AppException {
  readonly code = 'session_not_found';

  constructor(sessionId: string) {
    super(
      `No session found for id "${sessionId}". Create a new session and try again.`,
    );
  }
}
