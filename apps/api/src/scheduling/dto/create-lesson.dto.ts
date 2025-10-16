import { IsArray, IsDateString, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LessonExceptionInputDto {
  @IsDateString()
  date!: string;

  @IsIn(['CANCELLED', 'RESCHEDULED'])
  type!: 'CANCELLED' | 'RESCHEDULED';

  @IsOptional()
  @IsDateString()
  newStart?: string;

  @IsOptional()
  @IsDateString()
  newEnd?: string;
}

export class CreateLessonDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  educatorId!: string;

  @IsString()
  studentId!: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonExceptionInputDto)
  exceptions?: LessonExceptionInputDto[];
}
