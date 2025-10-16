import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PracticePieceTargetDto {
  @IsString()
  pieceId!: string;

  @IsInt()
  @Min(0)
  targetMinutes!: number;
}

export class PracticeVacationRangeDto {
  @IsDateString()
  start!: string;

  @IsDateString()
  end!: string;
}

export class CreatePracticeGoalDto {
  @IsString()
  studentId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  weeklyTargetMinutes!: number;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PracticePieceTargetDto)
  pieceTargets?: PracticePieceTargetDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PracticeVacationRangeDto)
  vacations?: PracticeVacationRangeDto[];
}
