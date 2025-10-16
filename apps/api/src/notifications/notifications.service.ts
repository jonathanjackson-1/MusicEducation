import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationTestDto } from './dto/notification-test.dto';
import { SubscribeNotificationDto } from './dto/subscribe-notification.dto';
import { NotificationOrchestratorService } from './notification-orchestrator.service';
import { NotificationSchedulerService } from './scheduler/notification-scheduler.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: NotificationOrchestratorService,
    private readonly scheduler: NotificationSchedulerService,
  ) {}

  create(studioId: string, dto: CreateNotificationDto) {
    const payload = dto.payload
      ? (() => {
          try {
            return JSON.parse(dto.payload as string);
          } catch (error) {
            return { raw: dto.payload };
          }
        })()
      : {};

    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        payload,
        studioId,
      },
    });
  }

  list(userId: string) {
    return this.prisma.notification.findMany({ where: { userId } });
  }

  markRead(id: string, dto: UpdateNotificationDto) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        readAt: dto.read ? new Date() : null,
      },
    });
  }

  sendTest(studioId: string, dto: NotificationTestDto) {
    return this.orchestrator.dispatch({
      studioId,
      userId: dto.userId,
      template: dto.template,
      context: dto.context ?? {},
      channels: dto.channels,
    });
  }

  subscribe(studioId: string, userId: string, dto: SubscribeNotificationDto) {
    return this.orchestrator.subscribe({
      studioId,
      userId,
      channel: dto.channel,
      endpoint: dto.endpoint,
      provider: dto.provider,
      locale: dto.locale,
      metadata: dto.metadata,
      templates: dto.templates,
    });
  }

  scheduleLessonReminders(
    studioId: string,
    lessonId: string,
    startAt: Date,
    recipients: string[],
    context: Record<string, unknown> = {},
    reminderOffsetsHours: number[] = [24, 1],
  ) {
    return this.scheduler.scheduleLessonReminders({
      studioId,
      lessonId,
      startAt,
      recipients,
      reminderOffsetsHours,
      context,
    });
  }

  scheduleOverdueAssignmentNudge(
    studioId: string,
    assignmentId: string,
    userId: string,
    dueAt: Date,
    context: Record<string, unknown> = {},
    nudgeDays = 1,
  ) {
    return this.scheduler.scheduleOverdueAssignmentNudge({
      studioId,
      assignmentId,
      userId,
      dueAt,
      context,
      nudgeDays,
    });
  }

  scheduleWeeklyPracticeSummary(
    studioId: string,
    userId: string,
    weekOf: Date,
    context: Record<string, unknown> = {},
    sendAt?: Date,
  ) {
    return this.scheduler.scheduleWeeklyPracticeSummary({
      studioId,
      userId,
      weekOf,
      context,
      sendAt,
    });
  }
}
