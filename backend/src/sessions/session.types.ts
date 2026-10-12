import type { ResumeDocument, Warning } from '@app/resume';

export interface Session {
  sessionId: string;
  resume: ResumeDocument;
  jobDescription: string | null;
  answers: Record<string, string>;
  warnings: Warning[];
}
