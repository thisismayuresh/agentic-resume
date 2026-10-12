export type GuardrailReason =
  | 'illicit_request'
  | 'illicit_document'
  | 'fabricated_credentials'
  | 'abusive_message'
  | 'off_topic';

export const GUARDRAIL_REASONS: GuardrailReason[] = [
  'illicit_request',
  'illicit_document',
  'fabricated_credentials',
  'abusive_message',
  'off_topic',
];
