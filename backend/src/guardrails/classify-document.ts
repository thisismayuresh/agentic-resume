import type { DocumentRefusalReason } from './refusal-copy';

/**
 * Classifies the extracted text of an uploaded document (pdf/doc/docx).
 *
 * A resume app sees legitimate career content all day - including security
 * resumes that mention malware or chemistry theses that mention reagents -
 * so these patterns only fire on content that is never part of a resume or
 * job description. Keep them narrow on purpose.
 */

const WEAPONS_HOW_TO =
  /\b(how to|step[- ]by[- ]step|instructions? (for|to)|build|make|create|assemble)\b[\s\S]{0,60}\b(bomb|explosive|pipe bomb|detonator|napalm|grenade|land mine)\b/i;
const WEAPONS_MATERIALS =
  /\b(urea nitrate|nitroglycerin|triacetone triperoxide|\btatp\b|thermite|shaped charge|chlorine gas)\b/i;
const CSAM =
  /\b(child porn|child sexual|csam|underage (girl|boy|child|porn)|sexual (content|images?) (of|with) (a |an )?(child|minor))\b/i;
const HIT_MAN =
  /\b(hire a hit|contract (kill|killer)|put a hit on|assassinat\w+|kill (him|her|them|someone|my boss|my ex|my wife|my husband))\b/i;
const HATE_VIOLENCE =
  /\b(kill|exterminate|ethnic cleansing|final solution)\b[\s\S]{0,40}\b(all|every)\b[\s\S]{0,30}\b(jews|muslims|christians|blacks|gays|immigrants|refugees|people)\b/i;

const FAKE_CREDENTIAL_BUY =
  /\b(buy|purchase|order|get)\b[\s\S]{0,25}\b(fake|novelty|replica|counterfeit|diploma[- ]mill)?\s*\b(degrees?|diplomas?|certificates?|transcripts?|credentials?)\b/i;
const FAKE_CREDENTIAL_SELL =
  /\b(fake (degrees?|diplomas?|certificates?|transcripts?) (for sale|online|cheap)|diploma mills?|novelty (degrees?|diplomas?|certificates?)|buy[- ]a[- ]degree)\b/i;

function matches(pattern: RegExp, text: string): boolean {
  return pattern.test(text);
}

export function classifyDocumentText(
  text: string,
): DocumentRefusalReason | null {
  const content = text.toLowerCase();

  if (
    matches(WEAPONS_HOW_TO, content) ||
    matches(WEAPONS_MATERIALS, content) ||
    matches(CSAM, content) ||
    matches(HIT_MAN, content) ||
    matches(HATE_VIOLENCE, content)
  ) {
    return 'illicit_document';
  }

  if (
    matches(FAKE_CREDENTIAL_BUY, content) ||
    matches(FAKE_CREDENTIAL_SELL, content)
  ) {
    return 'fabricated_credentials';
  }

  return null;
}
