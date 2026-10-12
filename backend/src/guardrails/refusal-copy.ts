import type { GuardrailReason } from './reason-codes';

export const REFUSAL_COPY: Record<GuardrailReason, string> = {
  illicit_request:
    "I can't help with that. I'm happy to keep working on your resume whenever you're ready.",
  illicit_document:
    "That file isn't a resume and I won't work with it. Upload something with your real work history and I'll take it from there.",
  fabricated_credentials:
    "I can't add employers, degrees, or dates that aren't yours. Send me the real details and I'll work them in.",
  abusive_message:
    "Let's keep it friendly and stay on the resume. Tell me what you'd like changed and I'll get to it.",
  off_topic:
    "Let's stay on the resume for now. What would you like me to change next?",
};

/**
 * Roast-flavored refusals for uploaded documents. The product roasts resumes
 * (FR-13), so a document that gets refused gets a short taunt in the same
 * voice - cheeky, never cruel, never preachy. One-liners, human tone.
 */
export type DocumentRefusalReason = 'illicit_document' | 'fabricated_credentials';

export const DOCUMENT_TAUNTS: Record<DocumentRefusalReason, string[]> = {
  illicit_document: [
    'This PDF has more red flags than a hire we regret in week two. I roast resumes, not this - try again with an actual resume.',
    "Hard pass. My contract says roast careers, not crime scenes. Upload something with a job history and I'm back to being helpful.",
    "Whatever this document is, it isn't getting past me. Bring me a resume - I'm much funnier when I'm roasting a summary section.",
    "That file went straight in the bin, and I once reviewed a resume that listed 'hard worker' as a skill. That hurt me more.",
    "Nope. I've roasted bad kerning, worse job titles, and a resume written entirely in the third person - but this, I'm leaving on the table.",
  ],
  fabricated_credentials: [
    "A degree from 'Totally Real University'? Adorable. Send me the version with your actual credentials and I'll make that look good instead.",
    'This resume claims more fake credentials than a recruiter inbox on a Monday. Real details only, then I can actually help.',
    "I'd polish this, but you can't varnish a house of cards. Rewrite it with the truth - that's a much better roast anyway.",
    "Faking it till you make it is a strategy; faking it onto paper is a liability. Try again with what really happened.",
    "Bold of you to invent a master's degree. Bolder of you to upload it here. Send the real one and I'll roast it with love.",
  ],
};

function hashString(input: string): number {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Picks a taunt deterministically from the filename and reason, so the same
 * refused file always gets the same answer (stable for users and tests).
 */
export function pickDocumentTaunt(
  reason: DocumentRefusalReason,
  seed: string,
): string {
  const taunts = DOCUMENT_TAUNTS[reason];
  return taunts[hashString(seed) % taunts.length];
}

export const UNSUPPORTED_CLAIM_WARNING =
  'I left out a claim that was not in what you gave me, so the resume stays truthful.';

export const NEUTRAL_UPDATE_MESSAGE = 'I updated your resume.';
