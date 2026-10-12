import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AgentModule } from './agent/index';
import { ChatModule } from './chat/index';
import { CreditsModule } from './credits/index';
import { ExportModule } from './export/index';
import { HealthModule } from './health/index';
import { MatchModule } from './match/index';
import { ResumeModule } from './resume/index';
import { SessionsModule } from './sessions/index';
import { UploadModule } from './upload/index';

@Module({
  imports: [
    // Loads backend/.env before anything else reads process.env.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    // Rate limiting: bots and scripts hammering the API get 429s.
    // Heavy endpoints (chat, upload, match, roast) carry stricter
    // per-route limits via @Throttle.
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 300 }],
    }),
    CreditsModule,
    HealthModule,
    SessionsModule,
    ResumeModule,
    UploadModule,
    MatchModule,
    AgentModule,
    ChatModule,
    ExportModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
