import { Injectable, Logger } from '@nestjs/common';
import { ChannelDispatchReceipt } from '../types/dispatch.types';
import { TwilioSmsProvider } from './providers/twilio-sms.provider';

export interface SmsMessageOptions {
  to: string;
  body: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SmsChannel {
  private readonly logger = new Logger(SmsChannel.name);

  constructor(private readonly twilioProvider: TwilioSmsProvider) {}

  async send(options: SmsMessageOptions): Promise<ChannelDispatchReceipt> {
    this.logger.debug(`Sending SMS to ${options.to}`);
    return this.twilioProvider.send({
      to: options.to,
      body: options.body,
      metadata: options.metadata ?? {},
    });
  }
}
