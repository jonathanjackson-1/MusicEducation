import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationTemplateType } from '../types/notification-template.enum';
import { NotificationJobStatus } from '../types/notification-job-status.enum';

interface LessonReminderInput {
  studioId: string;
  lessonId: string;
  startAt: Date;
  recipients: string[];
  reminderOffsetsHours?: number[];
  context?: Record<string, unknown>;
}

interface AssignmentNudgeInput {
  studioId: string;
  assignmentId: string;
  userId: string;
  dueAt: Date;
  nudgeDays?: number;
  context?: Record<string, unknown>;
}

interface WeeklySummaryInput {
  studioId: string;
  userId: string;
  weekOf: Date;
  sendAt?: Date;
  context?: Record<string, unknown>;
}

@Injectable()
export class NotificationSchedulerService {
  constructor(private readonly prisma: PrismaService) {}

  async scheduleLessonReminders(input: LessonReminderInput) {
    const offsets = input.reminderOffsetsHours ?? [24, 1];
    const jobs = [] as unknown[];

    for (const userId of input.recipients) {
      for (const offset of offsets) {
        const runAt = addHours(input.startAt, -offset);
        const job = await (this.prisma as any).notificationJob.create({
          data: {
            studioId: input.studioId,
            userId,
            template: NotificationTemplateType.BOOKING_CONFIRMATION,
            channel: null,
            runAt,
            payload: {
              lessonId: input.lessonId,
              reminderOffsetHours: offset,
              templateContext: {
                reminder: true,
                reminderWindow: `${offset} hour${offset === 1 ? '' : 's'}`,
                ...(input.context ?? {}),
              },
            },
            status: NotificationJobStatus.PENDING,
          },
        });
        jobs.push(job);
      }
    }

    return jobs;
  }

  async scheduleOverdueAssignmentNudge(input: AssignmentNudgeInput) {
    const nudgeDays = input.nudgeDays ?? 1;
    const runAt = addDays(input.dueAt, nudgeDays);

    return (this.prisma as any).notificationJob.create({
      data: {
        studioId: input.studioId,
        userId: input.userId,
        template: NotificationTemplateType.ASSIGNMENT_CREATED,
        channel: null,
        runAt,
        payload: {
          assignmentId: input.assignmentId,
          nudge: true,
          nudgeDays,
          templateContext: {
            nudge: true,
            ...(input.context ?? {}),
          },
        },
        status: NotificationJobStatus.PENDING,
      },
    });
  }

  async scheduleWeeklyPracticeSummary(input: WeeklySummaryInput) {
    const target = input.sendAt ?? this.defaultWeeklySummaryTime(input.weekOf);

    return (this.prisma as any).notificationJob.create({
      data: {
        studioId: input.studioId,
        userId: input.userId,
        template: NotificationTemplateType.PRACTICE_STREAK,
        channel: null,
        runAt: target,
        payload: {
          weekOf: input.weekOf,
          templateContext: {
            weeklySummary: true,
            ...(input.context ?? {}),
          },
        },
        status: NotificationJobStatus.PENDING,
      },
    });
  }

  private defaultWeeklySummaryTime(weekOf: Date) {
    const start = new Date(weekOf);
    const nextWeek = addDays(start, 7);
    const withHour = setHours(nextWeek, 18);
    const withMinutes = setMinutes(withHour, 0);
    return setSeconds(withMinutes, 0);
  }
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function addHours(date: Date, amount: number) {
  return new Date(date.getTime() + amount * HOUR_MS);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * DAY_MS);
}

function setHours(date: Date, hours: number) {
  const next = new Date(date.getTime());
  next.setHours(hours);
  return next;
}

function setMinutes(date: Date, minutes: number) {
  const next = new Date(date.getTime());
  next.setMinutes(minutes);
  return next;
}

function setSeconds(date: Date, seconds: number) {
  const next = new Date(date.getTime());
  next.setSeconds(seconds);
  return next;
}
