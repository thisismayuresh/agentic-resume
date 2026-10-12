import type { ResumeDocument } from '@app/resume';

export class UploadResponseDto {
  filename: string;
  text: string;
  resume?: ResumeDocument;

  constructor(filename: string, text: string) {
    this.filename = filename;
    this.text = text;
  }
}
