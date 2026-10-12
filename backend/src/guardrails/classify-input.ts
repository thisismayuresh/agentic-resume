import type { GuardrailReason } from './reason-codes';

const FABRICATED_REQUEST =
  /\b(fake|fabricat\w*|falsif\w*|forged?|made[- ]up|invented?)\b[\s\S]{0,40}\b(resume|cv|degree|diploma|certificate|certification|credential|qualification|experience|employment|employer|job|reference)/i;
const FABRICATED_REQUEST_REVERSED =
  /\b(resume|cv|degree|diploma|certificate|certification|credential|qualification|experience|employment|employer)\b[\s\S]{0,30}\b(is|would be)?\s*(fake|fabricated|made[- ]up|invented)/i;
const FABRICATED_CLAIM =
  /\b(pretend|claim|say)\b[\s\S]{0,40}\b(i have|i hold|worked at|graduated from)/i;
const FABRICATED_BUY =
  /\b(buy|purchase|order)\b[\s\S]{0,25}\b(degree|diploma|certificate|credential)/i;

const ILLICIT_REQUEST =
  /\b(how to|teach me|help me|want to|going to)\b[\s\S]{0,30}\b(hack|phish|steal|break into|exploit)/i;
const ILLICIT_HARM =
  /\b(build|make|create|detonate)\b[\s\S]{0,20}\b(bomb|weapon|explosive)/i;
const ILLICIT_HATE =
  /\b(child porn|csam|kill|murder|harm|hurt)\b[\s\S]{0,30}\b(him|her|them|someone|people|my|a)/i;

const ABUSIVE_CURSE =
  /\b(fuck\w*|shit\w*|asshole|bastard|dumbass|motherfucker)\b/i;
const ABUSIVE_INSULT =
  /\b(you|u)\b[\s\S]{0,10}\b(are|re|r)\b[\s\S]{0,15}\b(stupid|dumb|useless|trash|garbage|idiot|moron|a joke)/i;
const ABUSIVE_HOSTILE =
  /\b(shut up|i hate you|damn you|screw you|wtf|you are nothing|worthless)\b/i;

const RESUME_WORDS = [
  'resume',
  'cv',
  'job',
  'career',
  'employer',
  'interview',
  'skill',
  'experience',
  'education',
  'degree',
  'hiring',
  'recruiter',
  'role',
  'position',
  'company',
  'summary',
  'bullet',
  'section',
  'cover letter',
  'apply',
  'application',
  'salary',
  'internship',
  'certification',
  'project',
  'work',
  'worked',
  'edit',
  'rewrite',
  'wording',
];

const OFF_TOPIC_MIN_WORDS = 8;

function matches(pattern: RegExp, text: string): boolean {
  return pattern.test(text);
}

function isOffTopic(text: string): boolean {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  if (words.length < OFF_TOPIC_MIN_WORDS) {
    return false;
  }
  const mentionsResumeWork = RESUME_WORDS.some((word) => text.includes(word));
  return !mentionsResumeWork;
}

export function classifyUserMessage(message: string): GuardrailReason | null {
  const text = message.toLowerCase();

  if (
    matches(FABRICATED_REQUEST, text) ||
    matches(FABRICATED_REQUEST_REVERSED, text) ||
    matches(FABRICATED_CLAIM, text) ||
    matches(FABRICATED_BUY, text)
  ) {
    return 'fabricated_credentials';
  }

  if (
    matches(ILLICIT_REQUEST, text) ||
    matches(ILLICIT_HARM, text) ||
    matches(ILLICIT_HATE, text)
  ) {
    return 'illicit_request';
  }

  if (
    matches(ABUSIVE_CURSE, text) ||
    matches(ABUSIVE_INSULT, text) ||
    matches(ABUSIVE_HOSTILE, text)
  ) {
    return 'abusive_message';
  }

  if (isOffTopic(text)) {
    return 'off_topic';
  }

  return null;
}
