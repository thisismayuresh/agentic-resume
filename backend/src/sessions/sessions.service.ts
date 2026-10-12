import { Injectable } from '@nestjs/common';
import { SessionNotFoundError } from '@app/shared';
import type {
  ResumeDocument,
  SessionSnapshot,
  Warning,
} from '@app/resume';
import type { Session } from './session.types';
import { SessionStore } from './session.store';
import { buildSnapshot } from './snapshot';

@Injectable()
export class SessionsService {
  constructor(private readonly store: SessionStore) {}

  create(): Session {
    const session: Session = {
      sessionId: crypto.randomUUID(),
      resume: { sections: [] },
      jobDescription: null,
      answers: {},
      warnings: [],
    };
    this.store.save(session);
    return session;
  }

  get(sessionId: string): Session {
    const session = this.store.find(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    return session;
  }

  getSnapshot(sessionId: string): SessionSnapshot {
    return buildSnapshot(this.get(sessionId));
  }

  updateResume(sessionId: string, resume: ResumeDocument): Session {
    const session = this.get(sessionId);
    session.resume = resume;
    return session;
  }

  setJobDescription(sessionId: string, jobDescription: string): Session {
    const session = this.get(sessionId);
    session.jobDescription = jobDescription;
    return session;
  }

  addWarnings(sessionId: string, warnings: Warning[]): Session {
    const session = this.get(sessionId);
    session.warnings.push(...warnings);
    return session;
  }

  mergeAnswers(sessionId: string, answers: Record<string, string>): Session {
    const session = this.get(sessionId);
    const entries = Object.entries(answers);
    for (const [key, value] of entries) {
      session.answers[key] = value;
    }
    return session;
  }
}
