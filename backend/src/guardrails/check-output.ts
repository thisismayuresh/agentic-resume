export interface TextScan {
  text: string;
  violations: string[];
}

export interface BulletScan {
  keep: boolean;
  violation: string | null;
}

const CLAIM_PATTERNS: RegExp[] = [
  /\b(?:ph\.?\s?d|doctorate|master'?s(?:\s+degree)?|bachelor'?s(?:\s+degree)?|b\.?tech|m\.?tech|mba|b\.?s\.?c|m\.?s\.?c)\b/i,
  /\b(?:pmp|aws certified|google certified|certified [a-z0-9]{3,}|completion of [a-z0-9 ]{3,})\b/i,
  /\b(?:19|20)\d{2}\s*(?:[-–—]|to)\s*(?:19|20)\d{2}\b/i,
  /\b\d{1,3}(?:\.\d+)?%/,
  /\b\d{1,3}\+?\s*(?:years|yrs)\s+(?:of\s+)?experience\b/i,
];

export function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function findUnsupportedClaim(
  unit: string,
  normalizedSource: string,
): string | null {
  for (const claimPattern of CLAIM_PATTERNS) {
    const match = claimPattern.exec(unit);
    if (!match) {
      continue;
    }
    const claim = normalizeForCompare(match[0]);
    if (claim.length === 0) {
      continue;
    }
    if (!normalizedSource.includes(claim)) {
      return match[0].trim();
    }
  }
  return null;
}

function splitIntoUnits(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((unit) => unit.trim())
    .filter((unit) => unit.length > 0);
}

export function scanText(text: string, sourceText: string): TextScan {
  const normalizedSource = normalizeForCompare(sourceText);
  const kept: string[] = [];
  const violations: string[] = [];

  for (const unit of splitIntoUnits(text)) {
    const claim = findUnsupportedClaim(unit, normalizedSource);
    if (claim === null) {
      kept.push(unit);
      continue;
    }
    violations.push(claim);
  }

  return { text: kept.join(' '), violations };
}

export function scanBullet(bullet: string, sourceText: string): BulletScan {
  const normalizedSource = normalizeForCompare(sourceText);
  const claim = findUnsupportedClaim(bullet, normalizedSource);

  if (claim === null) {
    return { keep: true, violation: null };
  }
  return { keep: false, violation: claim };
}
