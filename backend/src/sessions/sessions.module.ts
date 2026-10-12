import { Module } from '@nestjs/common';
import { SessionStore } from './session.store';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  controllers: [SessionsController],
  providers: [SessionStore, SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
