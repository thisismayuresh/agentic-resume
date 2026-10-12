import type { ExportFormat } from '../types';

export const apiPaths = {
  createSession: '/api/sessions',

  session: (sessionId: string): string => `/api/sessions/${sessionId}`,

  messages: (sessionId: string): string => `/api/sessions/${sessionId}/messages`,

  upload: (sessionId: string): string => `/api/sessions/${sessionId}/upload`,

  match: (sessionId: string): string => `/api/sessions/${sessionId}/match`,

  roast: (sessionId: string): string => `/api/sessions/${sessionId}/options/roast`,

  quality: (sessionId: string): string => `/api/sessions/${sessionId}/options/quality`,

  resumeOps: (sessionId: string): string => `/api/sessions/${sessionId}/resume/ops`,

  exportResume: (sessionId: string, format: ExportFormat): string =>
    `/api/sessions/${sessionId}/export?format=${format}`,
} as const;
