import { Injectable } from '@nestjs/common';
import { ExportFailedError } from '@app/shared';
import type { Command } from '@app/shared';
import { renderDocx } from './render-docx';
import { renderPdf } from './render-pdf';
import type { ResumeLine } from './resume-view';

export type ExportFormat = 'pdf' | 'docx';

export interface ExportResumeInput {
  lines: ResumeLine[];
  format: ExportFormat;
}

export interface ExportDownload {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

const PDF_CONTENT_TYPE = 'application/pdf';
const DOCX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

@Injectable()
export class ExportResumeCommand implements Command<
  ExportResumeInput,
  ExportDownload
> {
  async execute(input: ExportResumeInput): Promise<ExportDownload> {
    if (input.format === 'docx') {
      const buffer = await this.render(() => renderDocx(input.lines), 'DOCX');
      return {
        buffer,
        contentType: DOCX_CONTENT_TYPE,
        filename: 'resume.docx',
      };
    }
    const buffer = await this.render(() => renderPdf(input.lines), 'PDF');
    return { buffer, contentType: PDF_CONTENT_TYPE, filename: 'resume.pdf' };
  }

  private async render(
    rendering: () => Promise<Buffer>,
    label: string,
  ): Promise<Buffer> {
    try {
      return await rendering();
    } catch (error) {
      if (error instanceof ExportFailedError) {
        throw error;
      }
      throw new ExportFailedError(
        `The ${label} could not be created. Try again.`,
      );
    }
  }
}
