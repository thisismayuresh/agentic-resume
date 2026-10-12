import { Body, Controller, Param, Post } from '@nestjs/common';
import { SessionsService } from '@app/sessions';
import { ApplyOpsDto } from './dto/apply-ops.dto';
import { ResumeService } from './resume.service';
import type { SessionSnapshot } from './resume.types';

@Controller('sessions')
export class ResumeController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly resumeService: ResumeService,
  ) {}

  @Post(':id/resume/ops')
  applyOps(@Param('id') id: string, @Body() dto: ApplyOpsDto): SessionSnapshot {
    const session = this.sessions.get(id);
    const updatedResume = this.resumeService.apply(session.resume, dto.ops);
    this.sessions.updateResume(id, updatedResume);
    return this.sessions.getSnapshot(id);
  }
}
