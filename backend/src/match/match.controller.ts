import { Body, Controller, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { MatchReport } from '@app/resume';
import { SessionsService } from '@app/sessions';
import { MatchRequestDto } from './dto/match-request.dto';
import { MatchResumeCommand } from './match.command';

@Controller('sessions')
export class MatchController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly matchCommand: MatchResumeCommand,
  ) {}

  // Matching calls the embedding model - stricter than the global limit.
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Post(':id/match')
  async match(
    @Param('id') id: string,
    @Body() dto: MatchRequestDto,
  ): Promise<MatchReport> {
    const session = this.sessions.setJobDescription(id, dto.jobDescription);
    const outcome = await this.matchCommand.execute({
      session,
      jobDescription: dto.jobDescription,
    });
    this.sessions.addWarnings(id, outcome.warnings);
    return outcome.report;
  }
}
