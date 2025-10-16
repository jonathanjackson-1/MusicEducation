import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateConsentDto {
  @IsString()
  userId!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsBoolean()
  granted?: boolean;
}
