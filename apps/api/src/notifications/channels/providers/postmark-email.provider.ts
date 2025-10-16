import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '../../types/notification-channel.enum';
import { ChannelDispatchReceipt } from '../../types/dispatch.types';
import { ProviderEmailMessage } from '../email.channel';

@Injectable()
export class PostmarkEmailProvider {
  readonly id = 'postmark';
  private readonly logger = new Logger(PostmarkEmailProvider.name);

  async send(message: ProviderEmailMessage): Promise<ChannelDispatchReceipt> {
    this.logger.verbose(`Postmark send queued to ${message.to}`);
    return {
      channel: NotificationChannel.EMAIL,
      provider: this.id,
      recipient: message.to,
      status: 'queued',
      metadata: {
        subject: message.subject,
        transport: 'postmark',
      },
    };
  }
}
