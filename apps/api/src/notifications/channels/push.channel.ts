import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChannelDispatchReceipt } from '../types/dispatch.types';
import { ApnsPushProvider } from './providers/apns-push.provider';
import { FcmPushProvider } from './providers/fcm-push.provider';

export interface PushToken {
  token: string;
  provider?: 'fcm' | 'apns';
  metadata?: Record<string, unknown>;
}

export interface PushMessageOptions {
  tokens: PushToken[];
  payload: Record<string, unknown>;
}

export interface ProviderPushMessage {
  token: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

@Injectable()
export class PushChannel {
  private readonly logger = new Logger(PushChannel.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly fcmProvider: FcmPushProvider,
    private readonly apnsProvider: ApnsPushProvider,
  ) {}

  async send(options: PushMessageOptions): Promise<ChannelDispatchReceipt[]> {
    const receipts: ChannelDispatchReceipt[] = [];

    for (const token of options.tokens) {
      const provider = this.selectProvider(token.provider);
      this.logger.debug(`Sending push via ${provider.id} to ${token.token}`);
      const receipt = await provider.send({
        token: token.token,
        payload: options.payload,
        metadata: token.metadata ?? {},
      });
      receipts.push(receipt);
    }

    return receipts;
  }

  private selectProvider(override?: 'fcm' | 'apns') {
    const selected =
      override ??
      (this.configService.get<'fcm' | 'apns'>('NOTIFICATIONS_PUSH_PROVIDER') || 'fcm');

    if (selected === 'apns') {
      return this.apnsProvider;
    }

    return this.fcmProvider;
  }
}
