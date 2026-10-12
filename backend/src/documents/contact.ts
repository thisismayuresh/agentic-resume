export interface ExtractedContact {
  fullName?: string;
  contact: { phone?: string; email?: string; location?: string };
}

const EMAIL_PATTERN = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/;
const PHONE_PATTERN = /\b(?:\+?\d[\d\s().-]{6,}\d)\b/;
const LOCATION_PATTERN = /^[A-Za-zÀ-ÿ .'-]{2,40},\s*[A-Za-zÀ-ÿ .'-]{2,30}$/;

const CONTACT_SCAN_LINES = 10;
const NAME_MAX_LENGTH = 60;

function countDigits(text: string): number {
  const matches = text.match(/\d/g);
  return matches ? matches.length : 0;
}

function looksLikeName(line: string): boolean {
  if (line.length === 0 || line.length > NAME_MAX_LENGTH) {
    return false;
  }
  if (EMAIL_PATTERN.test(line) || countDigits(line) > 3) {
    return false;
  }
  if (isBareSectionWord(line)) {
    return false;
  }
  const letters = line.match(/[A-Za-z]/g);
  return letters !== null && letters.length >= 2;
}

function isBareSectionWord(line: string): boolean {
  const lowered = line.toLowerCase();
  const sectionWords = [
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
  ];
  return sectionWords.some((word) => lowered === word);
}

function findPhone(lines: string[]): string | undefined {
  const yearRange = /\b(?:19|20)\d{2}\s*[-–—]\s*(?:19|20)\d{2}|present/i;

  for (const line of lines) {
    if (!PHONE_PATTERN.test(line)) {
      continue;
    }
    const match = PHONE_PATTERN.exec(line);
    if (!match) {
      continue;
    }
    const digits = countDigits(match[0]);
    if (digits < 7 || digits > 15) {
      continue;
    }
    if (yearRange.test(match[0])) {
      continue;
    }
    return match[0].trim();
  }
  return undefined;
}

function findEmail(lines: string[]): string | undefined {
  for (const line of lines) {
    const match = EMAIL_PATTERN.exec(line);
    if (match) {
      return match[0];
    }
  }
  return undefined;
}

function findLocation(
  lines: string[],
  email?: string,
  phone?: string,
): string | undefined {
  for (const line of lines) {
    if (email && line.includes(email)) {
      continue;
    }
    if (phone && line.includes(phone)) {
      continue;
    }
    if (line.length > 60 || line.length < 4) {
      continue;
    }
    const cleaned = line
      .replace(EMAIL_PATTERN, '')
      .replace(PHONE_PATTERN, '')
      .trim();
    if (cleaned.length < 4) {
      continue;
    }
    if (LOCATION_PATTERN.test(cleaned)) {
      return cleaned;
    }
  }
  return undefined;
}

export function extractContact(lines: string[]): ExtractedContact {
  const scanArea = lines.slice(0, CONTACT_SCAN_LINES);
  const email = findEmail(scanArea);
  const phone = findPhone(scanArea);
  const location = findLocation(scanArea, email, phone);

  const result: ExtractedContact = { contact: {} };
  if (phone) {
    result.contact.phone = phone;
  }
  if (email) {
    result.contact.email = email;
  }
  if (location) {
    result.contact.location = location;
  }

  const firstLine = lines.length > 0 ? lines[0] : '';
  if (looksLikeName(firstLine)) {
    result.fullName = firstLine;
  }
  return result;
}
