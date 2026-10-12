import {
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { SessionsService } from '@app/sessions';
import { UploadRequestDto } from './dto/upload-request.dto';
import type { UploadResponseDto } from './dto/upload-response.dto';
import { UploadService } from './upload.service';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

@Controller('sessions')
export class UploadController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly uploadService: UploadService,
  ) {}

  // Parsing files costs CPU - keep automated uploads from becoming a DoS.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':id/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  upload(
    @Param('id') id: string,
    @Body() dto: UploadRequestDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    this.sessions.get(id);
    return this.uploadService.handleUpload(id, file, dto.kind);
  }
}
