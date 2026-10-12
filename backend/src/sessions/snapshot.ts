import type { SessionSnapshot } from '@app/resume';
import type { Session } from './session.types';

export function buildSnapshot(session: Session): SessionSnapshot {
  return {
    sessionId: session.sessionId,
    resume: session.resume,
    jobDescription: session.jobDescription,
    warnings: session.warnings,
  };
}
