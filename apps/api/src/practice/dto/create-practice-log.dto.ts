import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePracticeLogDto {
  @IsInt()
  @Min(0)
  durationMinutes!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  pieceId?: string;

  @IsOptional()
  @IsString()
  instrumentId?: string;

  @IsOptional()
  @IsString()
  practiceGoalId?: string;
}
