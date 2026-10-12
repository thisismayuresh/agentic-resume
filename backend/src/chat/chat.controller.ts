import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { SessionsService } from '@app/sessions';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SseEmitter } from './sse-emitter';

@Controller('sessions')
export class ChatController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly chatService: ChatService,
  ) {}

  // LLM calls are expensive - keep chat behind a stricter limit than the
  // global one so scripts cannot burn through the model.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    const session = this.sessions.get(id);
    if (dto.answers) {
      this.sessions.mergeAnswers(id, dto.answers);
    }

    const emitter = new SseEmitter(res);
    const abort = new AbortController();
    res.on('close', () => {
      emitter.close();
      abort.abort();
    });
    emitter.start();

    await this.chatService.runMessage({
      session,
      message: dto.content,
      emitter,
      signal: abort.signal,
    });
  }
}
