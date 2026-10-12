import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { StreamableFile } from '@nestjs/common';
import { SessionsService } from '@app/sessions';
import { ExportQueryDto } from './dto/export-query.dto';
import { ExportResumeCommand } from './export.command';
import { buildResumeView } from './resume-view';

@Controller('sessions')
export class ExportController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly exportCommand: ExportResumeCommand,
  ) {}

  @Get(':id/export')
  async exportResume(
    @Param('id') id: string,
    @Query() query: ExportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const session = this.sessions.get(id);
    const lines = buildResumeView(session.resume);
    const download = await this.exportCommand.execute({
      lines,
      format: query.format,
    });
    res.set({
      'Content-Type': download.contentType,
      'Content-Disposition': `attachment; filename="${download.filename}"`,
    });
    return new StreamableFile(download.buffer);
  }
}
