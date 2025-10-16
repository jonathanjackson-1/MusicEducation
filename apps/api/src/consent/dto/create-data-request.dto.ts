import { DataRequestType } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateDataRequestDto {
  @IsString()
  subjectId!: string;

  @IsEnum(DataRequestType)
  type!: DataRequestType;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
