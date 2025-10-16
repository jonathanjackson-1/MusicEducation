import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RenderedEmailTemplate } from '../template-engine/notification-template-engine.service';
import { ChannelDispatchReceipt } from '../types/dispatch.types';
import { PostmarkEmailProvider } from './providers/postmark-email.provider';
import { SesEmailProvider } from './providers/ses-email.provider';

export interface EmailMessageOptions {
  to: string;
  template: RenderedEmailTemplate;
  metadata?: Record<string, unknown>;
  providerOverride?: 'postmark' | 'ses';
}

@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly postmarkProvider: PostmarkEmailProvider,
    private readonly sesProvider: SesEmailProvider,
  ) {}

  async send(options: EmailMessageOptions): Promise<ChannelDispatchReceipt> {
    const provider = this.selectProvider(options.providerOverride);
    this.logger.debug(
      `Sending email via ${provider.id} to ${options.to} (subject: ${options.template.subject})`,
    );
    return provider.send({
      to: options.to,
      subject: options.template.subject,
      html: options.template.html,
      text: options.template.text,
      metadata: options.metadata ?? {},
    });
  }

  private selectProvider(override?: 'postmark' | 'ses') {
    const selected =
      override ??
      (this.configService.get<'postmark' | 'ses'>('NOTIFICATIONS_EMAIL_PROVIDER') || 'postmark');

    if (selected === 'ses') {
      return this.sesProvider;
    }

    return this.postmarkProvider;
  }
}

export interface ProviderEmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  metadata: Record<string, unknown>;
}
