import { IsIn } from 'class-validator';

export class ExportQueryDto {
  @IsIn(['pdf', 'docx'])
  format: 'pdf' | 'docx';
}
