import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateParentalConsentDto {
  @IsString()
  minorId!: string;

  @IsString()
  guardianId!: string;

  @IsString()
  relationship!: string;

  @IsOptional()
  @IsBoolean()
  granted?: boolean;

  @IsOptional()
  @IsString()
  type?: string;
}
