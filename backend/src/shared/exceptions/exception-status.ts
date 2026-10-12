import { AppException } from './app.exception';

export function statusForException(exception: AppException): number {
  switch (exception.code) {
    case 'session_not_found':
      return 404;
    case 'guardrail_violation':
    case 'invalid_op':
      return 400;
    case 'insufficient_credits':
      return 402;
    case 'document_parse_failed':
      return 422;
    case 'llm_unavailable':
      return 503;
    case 'model_output_invalid':
    case 'agent_failed':
      return 502;
    case 'export_failed':
      return 500;
    default:
      return 500;
  }
}

export function codeForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'bad_request';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 413:
      return 'payload_too_large';
    case 415:
      return 'unsupported_media_type';
    case 429:
      return 'too_many_requests';
    default:
      return `http_${status}`;
  }
}
