import { AppException } from './app.exception';

export class ModelOutputError extends AppException {
  readonly code = 'model_output_invalid';

  constructor(message: string) {
    super(message);
  }
}
