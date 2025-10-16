import { IsOptional, IsString } from 'class-validator';

export class CreateRecordingDto {
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  practiceLogId?: string;

  @IsOptional()
  @IsString()
  submissionId?: string;
}
