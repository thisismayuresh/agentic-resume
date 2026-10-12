import { Module } from '@nestjs/common';
import { LlmModule } from '@app/llm';
import { SessionsModule } from '@app/sessions';
import { ChromaSimilarity } from './chroma-similarity';
import { MatchController } from './match.controller';
import { MatchResumeCommand } from './match.command';

@Module({
  imports: [SessionsModule, LlmModule],
  controllers: [MatchController],
  providers: [ChromaSimilarity, MatchResumeCommand],
})
export class MatchModule {}
