import { ArrayNotEmpty, IsArray } from 'class-validator';

export class ApplyOpsDto {
  @IsArray()
  @ArrayNotEmpty()
  ops: unknown[];
}
