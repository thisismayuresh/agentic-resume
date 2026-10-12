import { Injectable } from '@nestjs/common';
import { DocumentParseError } from '@app/shared';
import type { ResumeDocument } from '@app/resume';
import { extractResumeDocument } from './extract-resume';
import type { ParsedDocument } from './documents.types';
import { readDoc } from './readers/read-doc';
import { readDocx } from './readers/read-docx';
import { readPdf } from './readers/read-pdf';

const SUPPORTED_EXTENSIONS = ['pdf', 'docx', 'doc'];

@Injectable()
export class DocumentsService {
  async read(buffer: Buffer, filename: string): Promise<ParsedDocument> {
    const extension = filename.toLowerCase().split('.').pop() ?? '';
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      throw new DocumentParseError(
        `"${filename}" is not a supported file type. Upload a .pdf, .docx or .doc file.`,
      );
    }

    const text = await this.readText(buffer, extension, filename);
    if (text.trim().length === 0) {
      throw new DocumentParseError(
        `No text could be read from "${filename}". If it is a scanned PDF, paste the text into the chat instead.`,
      );
    }
    return { filename, text };
  }

  extractResume(text: string): ResumeDocument {
    return extractResumeDocument(text);
  }

  private async readText(
    buffer: Buffer,
    extension: string,
    filename: string,
  ): Promise<string> {
    try {
      if (extension === 'pdf') {
        return await readPdf(buffer);
      }
      if (extension === 'docx') {
        return await readDocx(buffer);
      }
      return await readDoc(buffer);
    } catch {
      throw new DocumentParseError(
        `Could not read "${filename}". The file may be damaged or password-protected.`,
      );
    }
  }
}
