import { Inject, Injectable } from '@nestjs/common';
import {
  LLM_CLIENT,
  type LlmClient,
  type LlmMessage,
} from '@app/llm';
import {
  buildReviewSystemPrompt,
  buildReviewUserPrompt,
} from './review.prompt';
import type { Session } from '@app/sessions';
import type { RoastReport } from '@app/resume';
import { parseRoastReport } from './parse-roast';

@Injectable()
export class ResumeReviewAgent {
  constructor(@Inject(LLM_CLIENT) private readonly llm: LlmClient) {}

  async run(session: Session): Promise<RoastReport> {
    const messages: LlmMessage[] = [
      { role: 'system', content: buildReviewSystemPrompt() },
      {
        role: 'user',
        content: buildReviewUserPrompt(
          JSON.stringify(session.resume, null, 2),
          session.jobDescription,
        ),
      },
    ];
    const raw = await this.llm.chat(messages);
    return parseRoastReport(raw);
  }
}
