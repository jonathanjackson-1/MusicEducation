import { NotificationOrchestratorService } from './notification-orchestrator.service';
import { NotificationTemplateEngine } from './template-engine/notification-template-engine.service';
import { NotificationTemplateType } from './types/notification-template.enum';
import { NotificationChannel } from './types/notification-channel.enum';
import { ChannelDispatchReceipt } from './types/dispatch.types';

class FakeEmailChannel {
  public readonly messages: any[] = [];

  async send(options: any): Promise<ChannelDispatchReceipt> {
    this.messages.push(options);
    return {
      channel: NotificationChannel.EMAIL,
      provider: 'fake-email',
      recipient: options.to,
      status: 'sent',
      metadata: { subject: options.template.subject },
    };
  }
}

class FakeSmsChannel {
  public readonly messages: any[] = [];

  async send(options: any): Promise<ChannelDispatchReceipt> {
    this.messages.push(options);
    return {
      channel: NotificationChannel.SMS,
      provider: 'fake-sms',
      recipient: options.to,
      status: 'sent',
      metadata: {},
    };
  }
}

class FakePushChannel {
  public readonly messages: any[] = [];

  async send(options: any): Promise<ChannelDispatchReceipt[]> {
    this.messages.push(options);
    return options.tokens.map((token: any) => ({
      channel: NotificationChannel.PUSH,
      provider: `fake-${token.provider ?? 'fcm'}`,
      recipient: token.token,
      status: 'sent',
      metadata: token.metadata ?? {},
    }));
  }
}

describe('NotificationOrchestratorService', () => {
  const prisma: any = {
    studio: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'studio-1',
        name: 'Sound Studio',
        locale: 'en',
      }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'user-1',
        firstName: 'Avery',
        lastName: 'Student',
        email: 'avery@student.test',
      }),
    },
    notification: {
      create: jest.fn().mockResolvedValue(null),
    },
    notificationPreference: {
      findMany: jest.fn().mockResolvedValue([
        { channel: NotificationChannel.EMAIL, enabled: true },
        { channel: NotificationChannel.SMS, enabled: true },
        { channel: NotificationChannel.PUSH, enabled: true },
      ]),
      upsert: jest.fn(),
    },
    notificationSubscription: {
      findMany: jest.fn().mockResolvedValue([
        {
          channel: NotificationChannel.SMS,
          endpoint: '+15551234567',
          locale: 'en',
        },
        {
          channel: NotificationChannel.PUSH,
          endpoint: 'fcm-token',
          provider: 'fcm',
          metadata: { device: 'android' },
        },
        {
          channel: NotificationChannel.PUSH,
          endpoint: 'apns-token',
          provider: 'apns',
          metadata: { device: 'ios' },
        },
      ]),
      upsert: jest.fn(),
    },
  };

  const emailChannel = new FakeEmailChannel();
  const smsChannel = new FakeSmsChannel();
  const pushChannel = new FakePushChannel();
  const orchestrator = new NotificationOrchestratorService(
    prisma,
    new NotificationTemplateEngine(),
    emailChannel as any,
    smsChannel as any,
    pushChannel as any,
  );

  it('dispatches notifications across channels respecting preferences', async () => {
    const receipts = await orchestrator.dispatch({
      studioId: 'studio-1',
      userId: 'user-1',
      template: NotificationTemplateType.BOOKING_CONFIRMATION,
      context: {
        reminder: true,
        reminderWindow: '24 hours',
        lessonDate: 'April 22, 2024',
        lessonTime: '3:30 PM',
        educatorName: 'Logan Teacher',
        bookingUrl: 'https://studio.example.com/lessons/lesson-123',
        roomName: 'Studio A',
      },
    });

    expect({
      receipts,
      emailMessages: emailChannel.messages,
      smsMessages: smsChannel.messages,
      pushMessages: pushChannel.messages,
      loggedNotification: prisma.notification.create.mock.calls[0][0],
    }).toMatchSnapshot();
  });

  it('subscribes to channels and upserts preferences', async () => {
    prisma.notificationSubscription.upsert.mockResolvedValue({
      id: 'sub-1',
      channel: NotificationChannel.PUSH,
      endpoint: 'device-token',
      provider: 'fcm',
    });
    prisma.notificationPreference.upsert.mockResolvedValue({
      id: 'pref-1',
      channel: NotificationChannel.PUSH,
      template: NotificationTemplateType.PRACTICE_STREAK,
      enabled: true,
    });

    const result = await orchestrator.subscribe({
      studioId: 'studio-1',
      userId: 'user-1',
      channel: NotificationChannel.PUSH,
      endpoint: 'device-token',
      provider: 'fcm',
      locale: 'en',
      metadata: { platform: 'ios' },
      templates: [
        {
          template: NotificationTemplateType.PRACTICE_STREAK,
          enabled: true,
        },
      ],
    });

    expect({
      subscriptionCall: prisma.notificationSubscription.upsert.mock.calls[0][0],
      preferenceCall: prisma.notificationPreference.upsert.mock.calls[0][0],
      result,
    }).toMatchSnapshot();
  });
});
