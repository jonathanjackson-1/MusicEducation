import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '../../types/notification-channel.enum';
import { ChannelDispatchReceipt } from '../../types/dispatch.types';
import { ProviderPushMessage } from '../push.channel';

@Injectable()
export class FcmPushProvider {
  readonly id = 'fcm';
  private readonly logger = new Logger(FcmPushProvider.name);

  async send(
    message: ProviderPushMessage,
  ): Promise<ChannelDispatchReceipt> {
    this.logger.verbose(`FCM push queued to ${message.token}`);
    return {
      channel: NotificationChannel.PUSH,
      provider: this.id,
      recipient: message.token,
      status: 'queued',
      metadata: {
        transport: 'fcm',
      },
    };
  }
}
