export class CreateSessionResponseDto {
  sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }
}
