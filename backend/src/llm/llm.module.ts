import { Module } from '@nestjs/common';
import { LLM_CLIENT } from './llm-client';
import { OpenAiAdapter } from './openai.adapter';

@Module({
  providers: [{ provide: LLM_CLIENT, useClass: OpenAiAdapter }],
  exports: [LLM_CLIENT],
})
export class LlmModule {}
