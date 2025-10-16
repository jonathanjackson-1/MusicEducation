import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @MinLength(8)
  newPassword!: string;

  @IsOptional()
  @IsString()
  totpCode?: string;
}
