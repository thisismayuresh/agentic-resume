export interface VerdictResult {
  verdict: string;
  fitWarning: string | null;
}

const STRONG_MIN = 70;
const DECENT_MIN = 40;

export function buildVerdict(
  percentage: number,
  missingSkills: string[],
): VerdictResult {
  if (percentage >= STRONG_MIN) {
    return {
      verdict:
        'Strong match. Your background lines up with what this role asks for.',
      fitWarning: null,
    };
  }
  if (percentage >= DECENT_MIN) {
    return {
      verdict: 'Decent match. A few gaps are worth closing before you apply.',
      fitWarning: null,
    };
  }
  return {
    verdict: 'Weak match. This role and your resume do not line up well.',
    fitWarning: buildFitWarning(missingSkills),
  };
}

function buildFitWarning(missingSkills: string[]): string {
  if (missingSkills.length === 0) {
    return 'Your resume does not cover much of what this job asks for. I would not apply as-is.';
  }
  const topMissing = missingSkills.slice(0, 3).join(', ');
  return `This role asks for ${topMissing}, which your resume does not show. I would not apply as-is without fixing that.`;
}
