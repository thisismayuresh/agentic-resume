import { ApiError } from './http';

export function friendlyMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Something went wrong. Please try again.';
  }
  switch (error.code) {
    case 'network':
      return 'Cannot reach the server.';
    case 'unknown_session':
      return 'This session is no longer available. Reload the page to start a new one.';
    case 'llm_unavailable':
      return 'The model is not responding right now. Try again in a moment.';
    case 'guardrail_violation':
      // The server message is the refusal (or taunt, for refused uploads) -
      // show it as-is instead of a generic line.
      return error.message;
    case 'document_parse_error':
    case 'unsupported_file':
      return 'We could not read that file. Try a .pdf, .doc, or .docx export.';
    case 'bad_response':
      return 'The server sent an unexpected reply. Please try again.';
    case 'stream_failed':
      return 'The connection to the server dropped. Try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
