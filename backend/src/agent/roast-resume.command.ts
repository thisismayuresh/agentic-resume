import { Injectable } from '@nestjs/common';
import type { RoastReport } from '@app/resume';
import type { Session } from '@app/sessions';
import type { Command } from '@app/shared';
import { ResumeReviewAgent } from './review/resume-review.agent';

export interface RoastResumeInput {
  session: Session;
}

@Injectable()
export class RoastResumeCommand implements Command<
  RoastResumeInput,
  RoastReport
> {
  constructor(private readonly review: ResumeReviewAgent) {}

  async execute(input: RoastResumeInput): Promise<RoastReport> {
    return this.review.run(input.session);
  }
}
