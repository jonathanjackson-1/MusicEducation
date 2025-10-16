import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { CommonModule } from '../common/common.module';
import { NotificationTemplateEngine } from './template-engine/notification-template-engine.service';
import { NotificationOrchestratorService } from './notification-orchestrator.service';
import { EmailChannel } from './channels/email.channel';
import { SmsChannel } from './channels/sms.channel';
import { PushChannel } from './channels/push.channel';
import { PostmarkEmailProvider } from './channels/providers/postmark-email.provider';
import { SesEmailProvider } from './channels/providers/ses-email.provider';
import { TwilioSmsProvider } from './channels/providers/twilio-sms.provider';
import { FcmPushProvider } from './channels/providers/fcm-push.provider';
import { ApnsPushProvider } from './channels/providers/apns-push.provider';
import { NotificationSchedulerService } from './scheduler/notification-scheduler.service';

@Module({
  imports: [CommonModule, ConfigModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationTemplateEngine,
    NotificationOrchestratorService,
    NotificationSchedulerService,
    EmailChannel,
    SmsChannel,
    PushChannel,
    PostmarkEmailProvider,
    SesEmailProvider,
    TwilioSmsProvider,
    FcmPushProvider,
    ApnsPushProvider,
  ],
  exports: [
    NotificationsService,
    NotificationOrchestratorService,
    NotificationSchedulerService,
    NotificationTemplateEngine,
  ],
})
export class NotificationsModule {}
