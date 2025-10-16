import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

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
  targetMinutes!: number;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
