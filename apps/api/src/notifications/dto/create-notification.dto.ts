import { IsJSON, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  userId!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsJSON()
  payload?: string;
}
