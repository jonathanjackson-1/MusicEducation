import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class TotpDto {
  @IsOptional()
  @IsBoolean()
  enable?: boolean;

  @IsString()
  code!: string;
}
