import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailChannel } from './channels/email.channel';
import { PushChannel } from './channels/push.channel';
import { SmsChannel } from './channels/sms.channel';
import { NotificationTemplateEngine } from './template-engine/notification-template-engine.service';
import { NotificationChannel, NOTIFICATION_CHANNELS } from './types/notification-channel.enum';
import { ChannelDispatchReceipt } from './types/dispatch.types';
import { NotificationTemplateType } from './types/notification-template.enum';

interface DispatchOptions {
  studioId: string;
  userId: string;
  template: NotificationTemplateType;
  context: Record<string, unknown>;
  channels?: NotificationChannel[];
  locale?: string;
}

interface SubscribeOptions {
  studioId: string;
  userId: string;
  channel: NotificationChannel;
  endpoint: string;
  provider?: string;
  locale?: string;
  metadata?: Record<string, unknown>;
  templates?: { template: NotificationTemplateType; enabled?: boolean }[];
}

@Injectable()
export class NotificationOrchestratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templateEngine: NotificationTemplateEngine,
    private readonly emailChannel: EmailChannel,
    private readonly smsChannel: SmsChannel,
    private readonly pushChannel: PushChannel,
  ) {}

  async dispatch(options: DispatchOptions): Promise<ChannelDispatchReceipt[]> {
    const [studio, user, preferences, subscriptions] = await Promise.all([
      this.prisma.studio.findUnique({ where: { id: options.studioId } }),
      this.prisma.user.findUnique({ where: { id: options.userId } }),
      (this.prisma as any).notificationPreference.findMany({
        where: { userId: options.userId, template: options.template },
      }),
      (this.prisma as any).notificationSubscription.findMany({
        where: { userId: options.userId, active: true },
      }),
    ]);

    if (!studio) {
      throw new Error(`Studio ${options.studioId} not found for notification dispatch`);
    }

    if (!user) {
      throw new Error(`User ${options.userId} not found for notification dispatch`);
    }

    const preferenceRecords = preferences as any[];
    const subscriptionRecords = subscriptions as any[];

    const preferenceByChannel = new Map<NotificationChannel, any>();
    for (const preference of preferenceRecords) {
      preferenceByChannel.set(preference.channel, preference);
    }

    const baseLocale =
      options.locale ||
      (preferenceRecords.find((pref: any) => pref.locale)?.locale as string | undefined) ||
      (subscriptionRecords.find((sub: any) => sub.locale)?.locale as string | undefined) ||
      (studio.locale as string | undefined) ||
      'en';

    const allowedChannels = options.channels ?? NOTIFICATION_CHANNELS;
    const receipts: ChannelDispatchReceipt[] = [];
    const context = this.enrichContext({
      studio,
      user,
      context: options.context,
      template: options.template,
    });

    if (allowedChannels.includes(NotificationChannel.EMAIL)) {
      const pref = preferenceByChannel.get(NotificationChannel.EMAIL);
      if (pref?.enabled === false) {
        receipts.push(this.skippedReceipt(NotificationChannel.EMAIL, user.email, 'opted_out'));
      } else if (!user.email) {
        receipts.push(this.skippedReceipt(NotificationChannel.EMAIL, user.id, 'missing_email'));
      } else {
        const locale = pref?.locale ?? baseLocale;
        const email = this.templateEngine.renderEmail(options.template, locale, context);
        const receipt = await this.emailChannel.send({
          to: user.email,
          template: email,
          metadata: { template: options.template, locale },
        });
        receipts.push(receipt);
      }
    }

    if (allowedChannels.includes(NotificationChannel.SMS)) {
      const pref = preferenceByChannel.get(NotificationChannel.SMS);
      const smsSubscription = subscriptionRecords.find(
        (sub: any) => sub.channel === NotificationChannel.SMS,
      );
      if (pref?.enabled === false) {
        receipts.push(this.skippedReceipt(NotificationChannel.SMS, smsSubscription?.endpoint, 'opted_out'));
      } else if (!smsSubscription) {
        receipts.push(this.skippedReceipt(NotificationChannel.SMS, user.id, 'no_subscription'));
      } else {
        const locale = pref?.locale ?? smsSubscription.locale ?? baseLocale;
        const sms = this.templateEngine.renderSms(options.template, locale, context);
        const receipt = await this.smsChannel.send({
          to: smsSubscription.endpoint,
          body: sms.body,
          metadata: { template: options.template, locale },
        });
        receipts.push(receipt);
      }
    }

    if (allowedChannels.includes(NotificationChannel.PUSH)) {
      const pref = preferenceByChannel.get(NotificationChannel.PUSH);
      const pushSubscriptions = subscriptionRecords.filter(
        (sub: any) => sub.channel === NotificationChannel.PUSH,
      );
      if (pref?.enabled === false) {
        receipts.push(this.skippedReceipt(NotificationChannel.PUSH, user.id, 'opted_out'));
      } else if (!pushSubscriptions.length) {
        receipts.push(this.skippedReceipt(NotificationChannel.PUSH, user.id, 'no_subscription'));
      } else {
        const locale = pref?.locale ?? baseLocale;
        const push = this.templateEngine.renderPush(options.template, locale, context);
        const pushReceipts = await this.pushChannel.send({
          tokens: pushSubscriptions.map((sub: any) => ({
            token: sub.endpoint,
            provider: sub.provider,
            metadata: sub.metadata ?? {},
          })),
          payload: push.payload,
        });
        receipts.push(...pushReceipts);
      }
    }

    await this.prisma.notification.create({
      data: {
        userId: options.userId,
        type: options.template,
        template: options.template,
        payload: {
          context: this.sanitiseForJson(context),
          locale: baseLocale,
          channels: allowedChannels,
          receipts,
        },
      },
    });

    return receipts;
  }

  async subscribe(options: SubscribeOptions) {
    const createData: Record<string, unknown> = {
      studioId: options.studioId,
      userId: options.userId,
      channel: options.channel,
      endpoint: options.endpoint,
      provider: options.provider,
      locale: options.locale,
      active: true,
    };

    if (options.metadata !== undefined) {
      createData.metadata = options.metadata;
    }

    const updateData: Record<string, unknown> = {
      active: true,
    };

    if (options.provider !== undefined) {
      updateData.provider = options.provider;
    }
    if (options.locale !== undefined) {
      updateData.locale = options.locale;
    }
    if (options.metadata !== undefined) {
      updateData.metadata = options.metadata;
    }

    const subscription = await (this.prisma as any).notificationSubscription.upsert({
      where: {
        studioId_userId_channel_endpoint: {
          studioId: options.studioId,
          userId: options.userId,
          channel: options.channel,
          endpoint: options.endpoint,
        },
      },
      update: updateData,
      create: createData,
    });

    let preferences: any[] = [];
    if (options.templates?.length) {
      preferences = await Promise.all(
        options.templates.map((template) =>
          (this.prisma as any).notificationPreference.upsert({
            where: {
              studioId_userId_template_channel: {
                studioId: options.studioId,
                userId: options.userId,
                template: template.template,
                channel: options.channel,
              },
            },
            update: {
              enabled: template.enabled ?? true,
              locale: options.locale,
            },
            create: {
              studioId: options.studioId,
              userId: options.userId,
              template: template.template,
              channel: options.channel,
              enabled: template.enabled ?? true,
              locale: options.locale,
            },
          }),
        ),
      );
    } else {
      preferences = await (this.prisma as any).notificationPreference.findMany({
        where: {
          userId: options.userId,
          channel: options.channel,
        },
      });
    }

    return { subscription, preferences };
  }

  private enrichContext({
    studio,
    user,
    context,
    template,
  }: {
    studio: any;
    user: any;
    context: Record<string, unknown>;
    template: NotificationTemplateType;
  }) {
    const recipientName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    const baseContext: Record<string, unknown> = { ...context };
    const rawPushData = baseContext['pushData'];
    const pushData = {
      template,
      userId: user.id,
      studioId: studio.id,
      ...(typeof rawPushData === 'object' && rawPushData !== null
        ? (rawPushData as Record<string, unknown>)
        : {}),
    };
    baseContext['pushData'] = pushData;

    return {
      studioName: studio.name,
      recipientName,
      ...baseContext,
    };
  }

  private sanitiseForJson(input: Record<string, unknown>) {
    const convert = (value: unknown): unknown => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (Array.isArray(value)) {
        return value.map((item) => convert(item));
      }
      if (value && typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([key, val]) => [
            key,
            convert(val),
          ]),
        );
      }
      return value;
    };

    return convert(input);
  }

  private skippedReceipt(
    channel: NotificationChannel,
    recipient: string | null | undefined,
    reason: string,
  ): ChannelDispatchReceipt {
    return {
      channel,
      provider: 'none',
      recipient: recipient ?? 'unknown',
      status: 'skipped',
      metadata: { reason },
    };
  }
}
