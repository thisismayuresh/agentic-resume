import { Injectable } from '@nestjs/common';
import { applyOps } from './apply-ops';
import { resumeToText } from './resume-to-text';
import type { ResumeDocument } from './resume.types';
import { parseResumeOps } from './validate-ops';

@Injectable()
export class ResumeService {
  apply(resume: ResumeDocument, rawOps: unknown[]): ResumeDocument {
    const ops = parseResumeOps(rawOps);
    return applyOps(resume, ops);
  }

  toText(resume: ResumeDocument): string {
    return resumeToText(resume);
  }
}
