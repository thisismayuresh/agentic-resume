import { Injectable } from '@nestjs/common';
import type { Session } from './session.types';

@Injectable()
export class SessionStore {
  private readonly sessions = new Map<string, Session>();

  save(session: Session): void {
    this.sessions.set(session.sessionId, session);
  }

  find(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }
}
