import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum CalendarScope {
  Studio = 'studio',
  Educator = 'educator',
  Student = 'student',
}

export class CalendarQueryDto {
  @IsEnum(CalendarScope)
  scope!: CalendarScope;

  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsOptional()
  @IsString()
  educatorId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  studioId?: string;
}

