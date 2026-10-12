import type { ResumeDocument, ResumeOp, Warning } from '@app/resume';

export interface BuildContext {
  sessionId: string;
  resume: ResumeDocument;
  resumeText: string;
  jobDescription: string | null;
  answers: Record<string, string>;
  userMessage: string;
  sourceText: string;
}

export interface PlanInstruction {
  sectionOrder: string[];
  focus: string;
}

export interface BuilderResult {
  assistantText: string;
  ops: ResumeOp[];
  warnings: Warning[];
}

export interface AssistantTextListener {
  onAssistantText(text: string): void;
}
