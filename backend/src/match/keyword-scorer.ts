import { containsTerm, findSkills, topKeywords } from './skill-terms';

const FALLBACK_SKILL_LIMIT = 8;
const COVERAGE_KEYWORD_LIMIT = 20;

export interface SkillOverlapResult {
  matchedSkills: string[];
  missingSkills: string[];
  skillOverlap: number;
  keywordCoverage: number;
}

function demandedSkills(jobDescription: string): string[] {
  const lexiconHits = findSkills(jobDescription);
  if (lexiconHits.length > 0) {
    return lexiconHits;
  }
  return topKeywords(jobDescription, FALLBACK_SKILL_LIMIT);
}

export function scoreSkills(
  resumeText: string,
  jobDescription: string,
): SkillOverlapResult {
  const resumeLower = resumeText.toLowerCase();
  const demanded = demandedSkills(jobDescription);

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  for (const skill of demanded) {
    if (containsTerm(resumeLower, skill)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const skillOverlap =
    demanded.length === 0 ? 0.5 : matchedSkills.length / demanded.length;

  const keywords = topKeywords(jobDescription, COVERAGE_KEYWORD_LIMIT);
  const foundKeywords = keywords.filter((keyword) =>
    containsTerm(resumeLower, keyword),
  );
  const keywordCoverage =
    keywords.length === 0 ? 0.5 : foundKeywords.length / keywords.length;

  return { matchedSkills, missingSkills, skillOverlap, keywordCoverage };
}
