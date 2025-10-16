import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '../../types/notification-channel.enum';
import { ChannelDispatchReceipt } from '../../types/dispatch.types';
import { ProviderEmailMessage } from '../email.channel';

@Injectable()
export class SesEmailProvider {
  readonly id = 'ses';
  private readonly logger = new Logger(SesEmailProvider.name);

  async send(message: ProviderEmailMessage): Promise<ChannelDispatchReceipt> {
    this.logger.verbose(`SES send queued to ${message.to}`);
    return {
      channel: NotificationChannel.EMAIL,
      provider: this.id,
      recipient: message.to,
      status: 'queued',
      metadata: {
        subject: message.subject,
        transport: 'ses',
      },
    };
  }
}
