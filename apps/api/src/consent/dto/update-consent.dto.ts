import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateConsentDto {
  @IsOptional()
  @IsBoolean()
  granted?: boolean;
}
