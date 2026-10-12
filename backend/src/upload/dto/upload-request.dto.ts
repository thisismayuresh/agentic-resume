import { IsIn } from 'class-validator';

export type UploadKind = 'resume' | 'jobDescription';

export class UploadRequestDto {
  @IsIn(['resume', 'jobDescription'])
  kind: UploadKind;
}
