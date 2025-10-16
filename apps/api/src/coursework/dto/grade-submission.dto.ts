import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { GradeResult } from '@prisma/client';

export class GradeSubmissionDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @IsOptional()
  @IsEnum(GradeResult)
  result?: GradeResult;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  rubricId?: string;
}
