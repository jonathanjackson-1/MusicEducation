import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationChannel } from '../types/notification-channel.enum';
import { NotificationTemplateType } from '../types/notification-template.enum';

export class SubscribeNotificationPreferenceDto {
  @IsEnum(NotificationTemplateType)
  template!: NotificationTemplateType;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class SubscribeNotificationDto {
  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @IsString()
  endpoint!: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubscribeNotificationPreferenceDto)
  templates?: SubscribeNotificationPreferenceDto[];
}
