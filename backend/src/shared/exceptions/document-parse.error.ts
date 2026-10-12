import { AppException } from './app.exception';

export class DocumentParseError extends AppException {
  readonly code = 'document_parse_failed';

  constructor(message: string) {
    super(message);
  }
}
