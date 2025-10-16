import { NotificationChannel } from './notification-channel.enum';

export interface ChannelDispatchRequest {
  recipient: string;
  payload: Record<string, unknown>;
}

export interface ChannelDispatchReceipt {
  channel: NotificationChannel;
  provider: string;
  recipient: string;
  status: 'queued' | 'sent' | 'skipped' | 'failed';
  metadata?: Record<string, unknown>;
}
