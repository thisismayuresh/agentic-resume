import { Controller, Get, Param, Post } from '@nestjs/common';
import type { SessionSnapshot } from '@app/resume';
import { CreateSessionResponseDto } from './dto/create-session.response';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post()
  createSession(): CreateSessionResponseDto {
    const session = this.sessions.create();
    return new CreateSessionResponseDto(session.sessionId);
  }

  @Get(':id')
  getSession(@Param('id') id: string): SessionSnapshot {
    return this.sessions.getSnapshot(id);
  }
}
