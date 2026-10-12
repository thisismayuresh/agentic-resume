import { AppException } from './app.exception';

export class AgentFailedError extends AppException {
  readonly code = 'agent_failed';

  constructor(message: string) {
    super(message);
  }
}
