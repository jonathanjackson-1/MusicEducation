import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { PracticeCategory } from '@prisma/client';

export class CreatePracticeLogDto {
  @ValidateIf((value) => value.durationMinutes !== undefined)
  @IsInt()
  @Min(0)
  durationMinutes?: number;

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

  @IsOptional()
  @IsEnum(PracticeCategory)
  category?: PracticeCategory;

  @IsOptional()
  @IsISO8601()
  startedAt?: string;

  @IsOptional()
  @IsISO8601()
  endedAt?: string;

  @IsOptional()
  @IsString()
  assignmentId?: string;
}
