import { AppException } from './app.exception';

export class InvalidOpError extends AppException {
  readonly code = 'invalid_op';

  constructor(message: string) {
    super(message);
  }
}
