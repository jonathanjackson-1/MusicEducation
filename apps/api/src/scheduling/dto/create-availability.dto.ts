import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateAvailabilityDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsString()
  educatorId!: string;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;
}
