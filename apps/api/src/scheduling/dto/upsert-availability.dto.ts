import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';

export class AvailabilityBlockDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsInt()
  dayOfWeek!: number;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @IsOptional()
  @IsString()
  educatorId?: string;
}

export class UpsertAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityBlockDto)
  blocks!: AvailabilityBlockDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deleteIds?: string[];
}
