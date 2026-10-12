const YEARS_PATTERN = /(\d{1,3})\+?\s*(?:years|yrs)/;
const SENIOR_WORDS = [
  'senior',
  'lead',
  'principal',
  'staff',
  'head of',
  'director',
  'manager',
];
const JUNIOR_WORDS = ['junior', 'intern', 'entry level', 'graduate'];

const YEARS_WEIGHT = 0.6;
const SENIORITY_WEIGHT = 0.4;

function findYears(text: string): number | null {
  const match = YEARS_PATTERN.exec(text);
  if (!match) {
    return null;
  }
  return Number.parseInt(match[1], 10);
}

function findLevel(text: string): 'senior' | 'junior' | null {
  const lowered = text.toLowerCase();
  if (SENIOR_WORDS.some((word) => lowered.includes(word))) {
    return 'senior';
  }
  if (JUNIOR_WORDS.some((word) => lowered.includes(word))) {
    return 'junior';
  }
  return null;
}

function yearsScore(resumeText: string, jobDescription: string): number {
  const requiredYears = findYears(jobDescription);
  const shownYears = findYears(resumeText);

  if (requiredYears === null || shownYears === null) {
    return 0.5;
  }
  if (shownYears >= requiredYears) {
    return 1;
  }
  if (shownYears >= requiredYears * 0.6) {
    return 0.6;
  }
  return 0.2;
}

function seniorityScore(resumeText: string, jobDescription: string): number {
  const wantedLevel = findLevel(jobDescription);
  const shownLevel = findLevel(resumeText);

  if (wantedLevel === null || shownLevel === null) {
    return 0.5;
  }
  if (wantedLevel === shownLevel) {
    return 1;
  }
  return 0.4;
}

export function experienceFit(
  resumeText: string,
  jobDescription: string,
): number {
  const fromYears = yearsScore(resumeText, jobDescription);
  const fromSeniority = seniorityScore(resumeText, jobDescription);
  return YEARS_WEIGHT * fromYears + SENIORITY_WEIGHT * fromSeniority;
}
