import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class TimeStampedNoteDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  timestamp!: number;

  @IsString()
  note!: string;
}

export class CreateSubmissionDto {
  @IsString()
  assignmentId!: string;

  @IsOptional()
  @IsString()
  textResponse?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeStampedNoteDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value;
  })
  notes?: TimeStampedNoteDto[];
}
