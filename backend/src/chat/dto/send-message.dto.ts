import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content: string;

  @IsOptional()
  @IsObject()
  answers?: Record<string, string>;
}
