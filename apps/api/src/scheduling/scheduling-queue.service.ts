import { Injectable, Logger } from '@nestjs/common';
import { Queue, QueueOptions } from 'bullmq';

type NullableQueue = Queue | undefined;

@Injectable()
export class SchedulingQueueService {
  private readonly logger = new Logger(SchedulingQueueService.name);
  private readonly reminderQueue: NullableQueue;
  private readonly reconciliationQueue: NullableQueue;
  private readonly waitlistQueue: NullableQueue;

  constructor() {
    const connection = this.createConnection();
    if (!connection) {
      this.logger.warn('Scheduling queue disabled - no Redis connection configured');
      this.reminderQueue = undefined;
      this.reconciliationQueue = undefined;
      this.waitlistQueue = undefined;
      return;
    }

    const queueOptions: QueueOptions = { connection, defaultJobOptions: { removeOnComplete: true, removeOnFail: true } };
    this.reminderQueue = new Queue('lesson-reminders', queueOptions);
    this.reconciliationQueue = new Queue('calendar-reconciliation', queueOptions);
    this.waitlistQueue = new Queue('waitlist-offers', queueOptions);
  }

  async enqueueLessonReminder(lessonId: string, occurrenceId: string, runAt: Date) {
    if (!this.reminderQueue) {
      this.logger.debug('Skipping lesson reminder enqueue because queue is disabled');
      return;
    }

    const delay = Math.max(runAt.getTime() - Date.now(), 0);
    await this.reminderQueue.add('lesson-reminder', { lessonId, occurrenceId }, { delay });
  }

  async enqueueRescheduleFollowUp(lessonId: string, occurrenceId: string) {
    if (!this.reconciliationQueue) {
      this.logger.debug('Skipping reschedule follow-up enqueue because queue is disabled');
      return;
    }

    const delay = 6 * 60 * 60 * 1000; // 6 hours
    await this.reconciliationQueue.add('reschedule-follow-up', { lessonId, occurrenceId }, { delay });
  }

  async enqueueWaitlistOffer(lessonId: string) {
    if (!this.waitlistQueue) {
      this.logger.debug('Skipping waitlist offer enqueue because queue is disabled');
      return;
    }

    await this.waitlistQueue.add('waitlist-offer', { lessonId });
  }

  async enqueueCancellationNotification(lessonId: string, occurrenceId: string, outcome: Record<string, unknown>) {
    if (!this.reconciliationQueue) {
      this.logger.debug('Skipping cancellation notification enqueue because queue is disabled');
      return;
    }

    await this.reconciliationQueue.add('cancellation-notification', { lessonId, occurrenceId, outcome });
  }

  async enqueueCalendarReconciliation(studioId: string) {
    if (!this.reconciliationQueue) {
      this.logger.debug('Skipping calendar reconciliation enqueue because queue is disabled');
      return;
    }

    await this.reconciliationQueue.add('calendar-reconcile', { studioId });
  }

  private createConnection(): QueueOptions['connection'] | null {
    if (process.env.SCHEDULING_QUEUE_DISABLED === 'true') {
      return null;
    }

    if (process.env.REDIS_URL) {
      return { url: process.env.REDIS_URL };
    }

    const host = process.env.REDIS_HOST;
    if (!host) {
      return null;
    }

    const port = Number(process.env.REDIS_PORT ?? 6379);
    const password = process.env.REDIS_PASSWORD;
    return {
      host,
      port,
      password,
    };
  }
}
