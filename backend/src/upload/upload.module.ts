import { Module } from '@nestjs/common';
import { DocumentsModule } from '@app/documents';
import { GuardrailsModule } from '@app/guardrails';
import { SessionsModule } from '@app/sessions';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [SessionsModule, DocumentsModule, GuardrailsModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
