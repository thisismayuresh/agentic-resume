import type { ResumeDocument } from './resume';

export interface SessionWarning {
  code: string;
  message: string;
}

export interface SessionSnapshot {
  sessionId: string;
  resume: ResumeDocument;
  jobDescription: string | null;
  warnings: SessionWarning[];
}

export interface CreatedSession {
  sessionId: string;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
}

export type DocumentKind = 'resume' | 'jobDescription';

export interface UploadSlotState {
  filename: string;
  text: string;
}

export interface UploadResult {
  filename: string;
  text: string;
  resume?: ResumeDocument;
}
