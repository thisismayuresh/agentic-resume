import { AppException } from './app.exception';

export class ExportFailedError extends AppException {
  readonly code = 'export_failed';

  constructor(message: string) {
    super(message);
  }
}
