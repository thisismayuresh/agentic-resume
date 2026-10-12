import { Injectable } from '@nestjs/common';
import { DocumentsService } from '@app/documents';
import { GuardrailsService } from '@app/guardrails';
import { DocumentParseError } from '@app/shared';
import { SessionsService } from '@app/sessions';
import { UploadResponseDto } from './dto/upload-response.dto';
import type { UploadKind } from './dto/upload-request.dto';

@Injectable()
export class UploadService {
  constructor(
    private readonly documents: DocumentsService,
    private readonly sessions: SessionsService,
    private readonly guardrails: GuardrailsService,
  ) {}

  async handleUpload(
    sessionId: string,
    file: { originalname: string; buffer: Buffer } | undefined,
    kind: UploadKind,
  ): Promise<UploadResponseDto> {
    if (!file || file.buffer.length === 0) {
      throw new DocumentParseError(
        'No file arrived. Pick a .pdf, .docx or .doc file and try again.',
      );
    }

    const parsed = await this.documents.read(file.buffer, file.originalname);
    this.guardrails.assertDocumentAllowed(parsed.text, parsed.filename);
    const response = new UploadResponseDto(parsed.filename, parsed.text);

    if (kind === 'jobDescription') {
      this.sessions.setJobDescription(sessionId, parsed.text);
      return response;
    }

    const resume = this.documents.extractResume(parsed.text);
    this.sessions.updateResume(sessionId, resume);
    response.resume = resume;
    return response;
  }
}
