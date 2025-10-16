import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CancelLessonDto {
  @IsDateString()
  occurrenceStart!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  requestedAt?: string;

  @IsOptional()
  @IsBoolean()
  waivePenalty?: boolean;
}
