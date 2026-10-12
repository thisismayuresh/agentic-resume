import { Module } from '@nestjs/common';
import { AgentModule } from '@app/agent';
import { ResumeModule } from '@app/resume';
import { SessionsModule } from '@app/sessions';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [SessionsModule, AgentModule, ResumeModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
