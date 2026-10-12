export interface BlockStyle {
  bold?: boolean;
  italic?: boolean;
}

export interface ResumeBlock {
  id: string;
  type: 'heading' | 'text' | 'bulletList' | 'entry';
  text?: string;
  bullets?: string[];
  meta?: { company?: string; role?: string; start?: string; end?: string };
  style?: BlockStyle;
}

export interface ResumeSection {
  id: string;
  title: string;
  blocks: ResumeBlock[];
}

export interface ResumeDocument {
  fullName?: string;
  contact?: { phone?: string; email?: string; location?: string };
  sections: ResumeSection[];
}

export type ResumeOp =
  | { type: 'insertSection'; at: number; section: ResumeSection }
  | { type: 'updateText'; path: string; text: string }
  | { type: 'moveBlock'; path: string; to: number }
  | { type: 'setStyle'; path: string; style: BlockStyle }
  | { type: 'removeBlock'; path: string };

export interface Warning {
  code: string;
  message: string;
}

export interface SessionSnapshot {
  sessionId: string;
  resume: ResumeDocument;
  jobDescription: string | null;
  warnings: Warning[];
}

export interface MatchReport {
  percentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  verdict: string;
  fitWarning: string | null;
}

export interface RoastReport {
  rating: number;
  verdict: string;
  redFlags: {
    title: string;
    severity: 'high' | 'medium' | 'low';
    why: string;
  }[];
  criticalFlaws: string[];
  strengths: string[];
  fixes: {
    impact: 'high' | 'medium' | 'low';
    suggestion: string;
    rewrite?: string;
  }[];
}
