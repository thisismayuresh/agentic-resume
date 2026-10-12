import type { QualityFinding, ResumeDocument } from '@app/resume';

export class UploadResponseDto {
  filename: string;
  text: string;
  resume?: ResumeDocument;
  /** Quality findings from the instant resume check (FR-15). */
  findings?: QualityFinding[];
  qualitySummary?: string;

  constructor(filename: string, text: string) {
    this.filename = filename;
    this.text = text;
  }
}
