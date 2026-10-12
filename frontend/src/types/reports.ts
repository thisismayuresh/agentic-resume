export type Severity = 'high' | 'medium' | 'low';

export interface MatchReport {
  percentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  verdict: string;
  fitWarning: string | null;
}

export interface RoastRedFlag {
  title: string;
  severity: Severity;
  why: string;
}

export interface RoastFix {
  impact: Severity;
  suggestion: string;
  rewrite?: string;
}

export interface RoastReport {
  rating: number;
  verdict: string;
  redFlags: RoastRedFlag[];
  criticalFlaws: string[];
  strengths: string[];
  fixes: RoastFix[];
}

export interface QualityFinding {
  code: string;
  message: string;
  path?: string;
}

export interface QualityReport {
  findings: QualityFinding[];
  summary: string;
}
