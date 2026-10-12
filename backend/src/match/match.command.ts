import { Injectable } from '@nestjs/common';
import type { MatchReport, Warning } from '@app/resume';
import { resumeToText } from '@app/resume';
import type { Session } from '@app/sessions';
import type { Command } from '@app/shared';
import { ChromaSimilarity } from './chroma-similarity';
import { experienceFit } from './experience-signal';
import { scoreSkills } from './keyword-scorer';
import { buildVerdict } from './verdict';

export interface MatchResumeInput {
  session: Session;
  jobDescription: string;
}

export interface MatchResumeOutput {
  report: MatchReport;
  warnings: Warning[];
}

const EMBEDDINGS_WARNING: Warning = {
  code: 'embeddings_unavailable',
  message:
    'Semantic match is off right now, so this score is based on keywords and skills only.',
};

const POOR_FIT_WARNING_CODE = 'poor_fit';

function combineScore(
  skillOverlap: number,
  keywordCoverage: number,
  experience: number,
  semantic: number | null,
): number {
  let score: number;
  if (semantic === null) {
    score = 0.45 * skillOverlap + 0.35 * keywordCoverage + 0.2 * experience;
  } else {
    score =
      0.4 * skillOverlap +
      0.3 * keywordCoverage +
      0.2 * experience +
      0.1 * semantic;
  }
  return Math.round(Math.min(Math.max(score, 0), 1) * 100);
}

@Injectable()
export class MatchResumeCommand implements Command<
  MatchResumeInput,
  MatchResumeOutput
> {
  constructor(private readonly chroma: ChromaSimilarity) {}

  async execute(input: MatchResumeInput): Promise<MatchResumeOutput> {
    const resumeText = resumeToText(input.session.resume);
    const skills = scoreSkills(resumeText, input.jobDescription);
    const experience = experienceFit(resumeText, input.jobDescription);
    const semantic = await this.chroma.similarity({
      sessionId: input.session.sessionId,
      resumeText,
      jobDescription: input.jobDescription,
    });

    const percentage = combineScore(
      skills.skillOverlap,
      skills.keywordCoverage,
      experience,
      semantic,
    );
    const verdict = buildVerdict(percentage, skills.missingSkills);
    const report: MatchReport = {
      percentage,
      matchedSkills: skills.matchedSkills,
      missingSkills: skills.missingSkills,
      verdict: verdict.verdict,
      fitWarning: verdict.fitWarning,
    };

    const warnings: Warning[] = [];
    if (semantic === null) {
      warnings.push(EMBEDDINGS_WARNING);
    }
    if (verdict.fitWarning) {
      warnings.push({
        code: POOR_FIT_WARNING_CODE,
        message: verdict.fitWarning,
      });
    }
    return { report, warnings };
  }
}
