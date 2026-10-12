import { Controller, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { RoastReport } from '@app/resume';
import { SessionsService } from '@app/sessions';
import { AgentOrchestrator } from './agent.orchestrator';

@Controller('sessions/:id/options')
export class AgentOptionsController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly orchestrator: AgentOrchestrator,
  ) {}

  // One roast runs a full model pass - 10 per minute is generous for a
  // human and useless for a bot.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('roast')
  roast(@Param('id') id: string): Promise<RoastReport> {
    const session = this.sessions.get(id);
    return this.orchestrator.runRoast({ session });
  }
}
