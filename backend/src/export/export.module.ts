import { Module } from '@nestjs/common';
import { SessionsModule } from '@app/sessions';
import { ExportController } from './export.controller';
import { ExportResumeCommand } from './export.command';

@Module({
  imports: [SessionsModule],
  controllers: [ExportController],
  providers: [ExportResumeCommand],
})
export class ExportModule {}
