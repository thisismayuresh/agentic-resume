interface KnownTitle {
  pattern: RegExp;
  title: string;
}

const KNOWN_TITLES: KnownTitle[] = [
  {
    pattern:
      /^(summary|professional summary|profile|about me|career summary|objective|career objective)$/,
    title: 'Summary',
  },
  {
    pattern:
      /^(work experience|professional experience|experience|employment|employment history|work history)$/,
    title: 'Experience',
  },
  {
    pattern:
      /^(education|academic background|education and training|academic qualifications)$/,
    title: 'Education',
  },
  {
    pattern:
      /^(skills|technical skills|core skills|key skills|competencies|areas of expertise)$/,
    title: 'Skills',
  },
  {
    pattern:
      /^(certifications?|licenses?|certifications and licenses|awards|honors)$/,
    title: 'Certifications',
  },
  {
    pattern:
      /^(projects|selected projects|personal projects|key projects|portfolio)$/,
    title: 'Projects',
  },
  {
    pattern:
      /^(languages|volunteer experience|volunteering|interests|links|references|publications)$/,
    title: 'Additional',
  },
];

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) =>
      word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word,
    )
    .join(' ');
}

function isAllCapsHeading(line: string): boolean {
  if (line.length > 40) {
    return false;
  }
  if (!/[A-Za-z]/.test(line)) {
    return false;
  }
  return line === line.toUpperCase();
}

export function detectSectionTitle(line: string): string | null {
  const trimmed = line
    .trim()
    .replace(/[:.]+$/, '')
    .trim();
  if (trimmed.length === 0 || trimmed.length > 40) {
    return null;
  }

  const lowered = trimmed.toLowerCase();
  for (const known of KNOWN_TITLES) {
    if (known.pattern.test(lowered)) {
      return known.title;
    }
  }
  if (isAllCapsHeading(trimmed)) {
    return titleCase(trimmed);
  }
  return null;
}
