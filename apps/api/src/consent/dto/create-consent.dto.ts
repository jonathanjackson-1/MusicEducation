import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateConsentDto {
  @IsString()
  subjectId!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsBoolean()
  granted?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
