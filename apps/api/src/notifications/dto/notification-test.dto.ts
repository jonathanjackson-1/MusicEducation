import { IsArray, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { NotificationChannel } from '../types/notification-channel.enum';
import { NotificationTemplateType } from '../types/notification-template.enum';

export class NotificationTestDto {
  @IsString()
  userId!: string;

  @IsEnum(NotificationTemplateType)
  template!: NotificationTemplateType;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];
}
