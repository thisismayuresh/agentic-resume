import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class MatchRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  jobDescription: string;
}
