import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '../../types/notification-channel.enum';
import { ChannelDispatchReceipt } from '../../types/dispatch.types';

export interface ProviderSmsMessage {
  to: string;
  body: string;
  metadata: Record<string, unknown>;
}

@Injectable()
export class TwilioSmsProvider {
  readonly id = 'twilio';
  private readonly logger = new Logger(TwilioSmsProvider.name);

  async send(message: ProviderSmsMessage): Promise<ChannelDispatchReceipt> {
    this.logger.verbose(`Twilio SMS queued to ${message.to}`);
    return {
      channel: NotificationChannel.SMS,
      provider: this.id,
      recipient: message.to,
      status: 'queued',
      metadata: {
        transport: 'twilio',
      },
    };
  }
}
