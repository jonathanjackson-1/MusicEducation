import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto, LessonExceptionInputDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { UpsertAvailabilityDto } from './dto/upsert-availability.dto';
import { CalendarQueryDto, CalendarScope } from './dto/calendar-query.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelLessonDto } from './dto/cancel-lesson.dto';
import { RescheduleAction, RescheduleLessonDto } from './dto/reschedule-lesson.dto';
import { SchedulingQueueService } from './scheduling-queue.service';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { UserRole } from '../common/interfaces/user-role.enum';
import { BookingRequestStatus, LessonExceptionType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

interface RecurrenceSeries {
  start: Date;
  end: Date;
  recurrenceRule?: string | null;
  exceptions?: LessonExceptionInputDto[];
}

interface ExpandedOccurrence {
  start: Date;
  end: Date;
  status: 'scheduled' | 'cancelled' | 'rescheduled';
  originalStart?: Date;
}

interface ExistingOccurrence {
  start: Date;
  end: Date;
  studentId: string;
}

interface ParsedRRule {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval: number;
  count?: number;
  until?: Date;
  byDay?: number[];
}

interface CancellationPolicyRule {
  windowHours: number;
  type: 'fee' | 'credit';
  amount: number;
}

interface BookingPolicy {
  minLeadMinutes: number;
  maxBookingsPerWeek: number;
  bufferMinutes: number;
  autoConfirm: boolean;
  rescheduleWindowHours: number;
  cancellationPolicy: CancellationPolicyRule[];
}

interface BookingValidationContext {
  now: Date;
  requestedStart: Date;
  requestedEnd: Date;
  studentId: string;
  existingOccurrences: ExistingOccurrence[];
  policy: BookingPolicy;
}

interface BookingValidationResult {
  status: 'auto-confirmed' | 'pending-approval';
  autoConfirm: boolean;
}

interface CancellationOutcome {
  penaltyType?: 'fee' | 'credit';
  penaltyAmount?: number;
  appliedWindowHours?: number;
}

const DEFAULT_BOOKING_POLICY: BookingPolicy = {
  minLeadMinutes: 60,
  maxBookingsPerWeek: 5,
  bufferMinutes: 15,
  autoConfirm: true,
  rescheduleWindowHours: 12,
  cancellationPolicy: [],
};

@Injectable()
export class SchedulingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: SchedulingQueueService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Expands a recurrence series into concrete lesson occurrences for the provided date range.
   */
  expandRecurrenceSeries(series: RecurrenceSeries, range: { start: Date; end: Date }): ExpandedOccurrence[] {
    if (range.start > range.end) {
      throw new BadRequestException('Invalid date range provided');
    }

    const duration = series.end.getTime() - series.start.getTime();
    if (duration <= 0) {
      throw new BadRequestException('Series end must be after start time');
    }

    const options = series.recurrenceRule ? this.parseRRule(series.recurrenceRule) : undefined;
    const baseDates = options
      ? this.generateRecurrenceDates(series.start, range, options)
      : this.isWithinRange(series.start, range)
      ? [new Date(series.start)]
      : [];

    const baseMap = new Map<number, Date>();
    baseDates.forEach((date) => baseMap.set(date.getTime(), date));

    const rescheduled: ExpandedOccurrence[] = [];
    const cancelled: ExpandedOccurrence[] = [];

    for (const exception of series.exceptions ?? []) {
      const originalDate = new Date(exception.date);
      const originalKey = originalDate.getTime();
      baseMap.delete(originalKey);

      if (exception.type === 'CANCELLED') {
        if (this.isWithinRange(originalDate, range)) {
          cancelled.push({
            start: originalDate,
            end: new Date(originalDate.getTime() + duration),
            status: 'cancelled',
            originalStart: originalDate,
          });
        }
        continue;
      }

      if (exception.type === 'RESCHEDULED') {
        const newStart = exception.newStart ? new Date(exception.newStart) : originalDate;
        const newEnd = exception.newEnd ? new Date(exception.newEnd) : new Date(newStart.getTime() + duration);
        if (this.isWithinRange(newStart, range)) {
          rescheduled.push({
            start: newStart,
            end: newEnd,
            status: 'rescheduled',
            originalStart: originalDate,
          });
        }
      }
    }

    const scheduled = Array.from(baseMap.values()).map((date) => ({
      start: date,
      end: new Date(date.getTime() + duration),
      status: 'scheduled' as const,
    }));

    const combined = [...scheduled, ...rescheduled, ...cancelled];
    combined.sort((a, b) => a.start.getTime() - b.start.getTime());
    return combined;
  }

  validateBookingAgainstPolicy(context: BookingValidationContext): BookingValidationResult {
    const { policy, now, requestedStart, requestedEnd, existingOccurrences, studentId } = context;

    if (requestedStart >= requestedEnd) {
      throw new BadRequestException('Requested end time must be after start time');
    }

    const leadMinutes = (requestedStart.getTime() - now.getTime()) / 60000;
    if (leadMinutes < policy.minLeadMinutes) {
      throw new BadRequestException(`Bookings must be made at least ${policy.minLeadMinutes} minutes in advance`);
    }

    for (const occurrence of existingOccurrences) {
      if (this.isBufferConflict(policy.bufferMinutes, occurrence, { start: requestedStart, end: requestedEnd })) {
        throw new BadRequestException('Requested time conflicts with an existing booking buffer');
      }
    }

    const weekStart = this.startOfISOWeek(requestedStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const bookingsThisWeek = existingOccurrences.filter((occurrence) => {
      return (
        occurrence.studentId === studentId &&
        occurrence.start >= weekStart &&
        occurrence.start < weekEnd
      );
    }).length;

    if (bookingsThisWeek >= policy.maxBookingsPerWeek) {
      throw new BadRequestException('Weekly booking limit reached');
    }

    return {
      status: policy.autoConfirm ? 'auto-confirmed' : 'pending-approval',
      autoConfirm: policy.autoConfirm,
    };
  }

  calculateCancellationOutcome(policy: BookingPolicy, requestedAt: Date, occurrenceStart: Date, waivePenalty = false): CancellationOutcome {
    if (waivePenalty || policy.cancellationPolicy.length === 0) {
      return {};
    }

    const diffMs = occurrenceStart.getTime() - requestedAt.getTime();
    const diffHours = diffMs / 3_600_000;

    if (diffHours < 0) {
      return { penaltyType: 'fee', penaltyAmount: 0, appliedWindowHours: 0 };
    }

    const sorted = [...policy.cancellationPolicy].sort((a, b) => a.windowHours - b.windowHours);
    const applicable = sorted.find((rule) => diffHours < rule.windowHours);

    if (!applicable) {
      return {};
    }

    return {
      penaltyType: applicable.type,
      penaltyAmount: applicable.amount,
      appliedWindowHours: applicable.windowHours,
    };
  }

  async upsertAvailability(studioId: string, educatorId: string, dto: UpsertAvailabilityDto) {
    const results = { created: [], updated: [], deleted: [] as string[] } as {
      created: string[];
      updated: string[];
      deleted: string[];
    };

    for (const block of dto.blocks) {
      if (block.id) {
        const updated = await this.prisma.availabilityBlock.update({
          where: { id: block.id },
          data: {
            dayOfWeek: block.dayOfWeek,
            startTime: new Date(block.startTime),
            endTime: new Date(block.endTime),
            recurrenceRule: block.recurrenceRule ?? null,
            educatorId: block.educatorId ?? educatorId,
          },
        });
        results.updated.push(updated.id);
      } else {
        const created = await this.prisma.availabilityBlock.create({
          data: {
            studioId,
            educatorId: block.educatorId ?? educatorId,
            dayOfWeek: block.dayOfWeek,
            startTime: new Date(block.startTime),
            endTime: new Date(block.endTime),
            recurrenceRule: block.recurrenceRule ?? null,
          },
        });
        results.created.push(created.id);
      }
    }

    if (dto.deleteIds?.length) {
      await this.prisma.availabilityBlock.deleteMany({ where: { id: { in: dto.deleteIds } } });
      results.deleted = dto.deleteIds;
    }

    return results;
  }

  listAvailability(studioId: string, educatorId?: string) {
    return this.prisma.availabilityBlock.findMany({
      where: {
        studioId,
        ...(educatorId ? { educatorId } : {}),
      },
    });
  }

  async getCalendar(studioId: string, query: CalendarQueryDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);

    const lessonWhere: Record<string, unknown> = { studioId };
    if (query.scope === CalendarScope.Educator && query.educatorId) {
      lessonWhere.educatorId = query.educatorId;
    }
    if (query.scope === CalendarScope.Student && query.studentId) {
      lessonWhere.studentId = query.studentId;
    }
    if (query.scope === CalendarScope.Studio && query.studioId) {
      lessonWhere.studioId = query.studioId;
    }

    const lessons = await this.prisma.lesson.findMany({
      where: lessonWhere,
      include: { exceptions: true },
    });

    const events = lessons.flatMap((lesson) => {
      const series: RecurrenceSeries = {
        start: lesson.startDate,
        end: lesson.endDate ?? new Date(lesson.startDate.getTime() + 60 * 60 * 1000),
        recurrenceRule: lesson.recurrenceRule,
        exceptions: lesson.exceptions?.map((exception) => {
          const note = this.parseExceptionNote(exception.note ?? undefined);
          return {
            date: exception.date.toISOString(),
            type: exception.type,
            newStart: note.newStart,
            newEnd: note.newEnd,
          };
        }),
      };
      return this.expandRecurrenceSeries(series, { start: from, end: to }).map((occurrence) => ({
        lessonId: lesson.id,
        title: lesson.title,
        educatorId: lesson.educatorId,
        studentId: lesson.studentId,
        start: occurrence.start,
        end: occurrence.end,
        status: occurrence.status,
        originalStart: occurrence.originalStart,
      }));
    });

    const availabilityWhere: Record<string, unknown> = { studioId };
    if (query.scope === CalendarScope.Educator && query.educatorId) {
      availabilityWhere.educatorId = query.educatorId;
    }

    const availability = await this.prisma.availabilityBlock.findMany({
      where: availabilityWhere,
    });

    return { events, availability };
  }

  async createLesson(studioId: string, dto: CreateLessonDto) {
    const lesson = await this.prisma.lesson.create({
      data: {
        studioId,
        title: dto.title,
        description: dto.description,
        educatorId: dto.educatorId,
        studentId: dto.studentId,
        roomId: dto.roomId,
        recurrenceRule: dto.recurrenceRule,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });

    if (dto.exceptions?.length) {
      for (const exception of dto.exceptions) {
        await this.prisma.lessonException.create({
          data: {
            lessonId: lesson.id,
            date: new Date(exception.date),
            type: exception.type as LessonExceptionType,
            note: exception.newStart
              ? JSON.stringify({ newStart: exception.newStart, newEnd: exception.newEnd })
              : undefined,
          },
        });
      }
    }

    return lesson;
  }

  updateLesson(id: string, dto: UpdateLessonDto) {
    return this.prisma.lesson.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async createBooking(studioId: string, user: AuthUser, dto: CreateBookingDto) {
    const policy = await this.getStudioPolicy(studioId);
    const studentId = dto.studentId ?? user.id;
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    const now = new Date();

    const weekStart = this.startOfISOWeek(start);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const occurrences = await this.prisma.lessonOccurrence.findMany({
      where: {
        lesson: {
          studioId,
          educatorId: dto.educatorId,
        },
        startTime: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      include: { lesson: true },
    });

    const existingOccurrences = occurrences.map((occurrence) => ({
      start: occurrence.startTime,
      end: occurrence.endTime,
      studentId: occurrence.lesson.studentId,
    }));

    const validation = this.validateBookingAgainstPolicy({
      policy,
      now,
      requestedStart: start,
      requestedEnd: end,
      existingOccurrences,
      studentId,
    });

    let lessonId = dto.lessonId;
    if (lessonId) {
      const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }
    } else {
      const lesson = await this.prisma.lesson.create({
        data: {
          studioId,
          title: dto.title ?? 'Lesson',
          description: dto.notes,
          educatorId: dto.educatorId,
          studentId,
          startDate: start,
          endDate: end,
        },
      });
      lessonId = lesson.id;
    }

    const occurrence = await this.prisma.lessonOccurrence.create({
      data: {
        lessonId,
        startTime: start,
        endTime: end,
      },
    });

    await this.prisma.bookingRequest.create({
      data: {
        studioId,
        studentId,
        lessonId,
        status: validation.autoConfirm ? BookingRequestStatus.APPROVED : BookingRequestStatus.PENDING,
      },
    });

    if (validation.autoConfirm) {
      const reminderDate = new Date(start.getTime() - 60 * 60 * 1000);
      await this.queue.enqueueLessonReminder(lessonId, occurrence.id, reminderDate);
    }

    return { lessonId, occurrenceId: occurrence.id, status: validation.status };
  }

  async rescheduleLesson(lessonId: string, user: AuthUser, dto: RescheduleLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { occurrences: true, exceptions: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const originalStart = new Date(dto.originalStart);
    const occurrence = lesson.occurrences.find((item) => item.startTime.getTime() === originalStart.getTime());

    if (!occurrence) {
      throw new NotFoundException('Occurrence not found');
    }

    const exceptionKey = { lessonId, date: originalStart };
    const existingException = await this.prisma.lessonException.findUnique({
      where: { lessonId_date: exceptionKey },
    });

    const now = new Date();

    switch (dto.action) {
      case RescheduleAction.Propose: {
        if (user.role !== UserRole.EDUCATOR && user.role !== UserRole.ADMIN) {
          throw new BadRequestException('Only educators can propose reschedules');
        }
        if (!dto.proposals?.length) {
          throw new BadRequestException('At least one proposal is required');
        }

        const payload = {
          status: 'pending',
          proposals: dto.proposals,
          proposedBy: user.id,
          proposedAt: now.toISOString(),
          note: dto.note,
        };

        await this.prisma.lessonException.upsert({
          where: { lessonId_date: exceptionKey },
          update: {
            type: LessonExceptionType.RESCHEDULED,
            note: JSON.stringify(payload),
          },
          create: {
            lessonId,
            date: originalStart,
            type: LessonExceptionType.RESCHEDULED,
            note: JSON.stringify(payload),
          },
        });

        await this.prisma.lessonOccurrence.update({
          where: { id: occurrence.id },
          data: { isCancelled: true },
        });

        await this.queue.enqueueRescheduleFollowUp(lessonId, occurrence.id);
        await this.audit.record({
          studioId: lesson.studioId,
          actorId: user.id,
          entity: 'lesson',
          entityId: lesson.id,
          action: 'lesson.reschedule.proposed',
          delta: {
            occurrenceId: occurrence.id,
            originalStart: occurrence.startTime.toISOString(),
            proposals: dto.proposals,
            note: dto.note,
          },
          context: { lessonId },
        });
        return payload;
      }
      case RescheduleAction.Accept: {
        if (!dto.proposalId) {
          throw new BadRequestException('proposalId is required to accept a reschedule');
        }
        if (user.role !== UserRole.STUDENT && user.role !== UserRole.PARENT) {
          throw new BadRequestException('Only students or parents can accept reschedules');
        }
        if (!existingException?.note) {
          throw new BadRequestException('No reschedule proposal to accept');
        }

        const payload = JSON.parse(existingException.note) as {
          status: string;
          proposals: { id: string; startTime: string; endTime: string }[];
        };

        if (payload.status !== 'pending') {
          throw new BadRequestException('Reschedule already resolved');
        }

        const proposal = payload.proposals.find((item) => item.id === dto.proposalId);
        if (!proposal) {
          throw new BadRequestException('Proposal not found');
        }

        const start = new Date(proposal.startTime);
        const end = new Date(proposal.endTime);

        const policy = await this.getStudioPolicy(lesson.studioId);
        const diffHours = (start.getTime() - now.getTime()) / 3_600_000;
        if (diffHours < policy.rescheduleWindowHours) {
          throw new BadRequestException('Reschedule window has expired');
        }

        const updatedOccurrence = await this.prisma.lessonOccurrence.update({
          where: { id: occurrence.id },
          data: {
            startTime: start,
            endTime: end,
            isCancelled: false,
          },
        });

        const updatedPayload = {
          ...payload,
          status: 'accepted',
          acceptedProposalId: proposal.id,
          acceptedBy: user.id,
          acceptedAt: now.toISOString(),
          newStart: proposal.startTime,
          newEnd: proposal.endTime,
        };

        await this.prisma.lessonException.update({
          where: { lessonId_date: exceptionKey },
          data: {
            type: LessonExceptionType.RESCHEDULED,
            note: JSON.stringify(updatedPayload),
          },
        });

        await this.queue.enqueueLessonReminder(lessonId, occurrence.id, new Date(start.getTime() - 60 * 60 * 1000));
        await this.audit.record({
          studioId: lesson.studioId,
          actorId: user.id,
          entity: 'lesson',
          entityId: lesson.id,
          action: 'lesson.reschedule.accepted',
          delta: {
            occurrenceId: occurrence.id,
            previous: {
              start: occurrence.startTime.toISOString(),
              end: occurrence.endTime.toISOString(),
            },
            current: {
              start: updatedOccurrence.startTime.toISOString(),
              end: updatedOccurrence.endTime.toISOString(),
            },
            proposalId: proposal.id,
          },
          context: { lessonId },
        });
        return updatedOccurrence;
      }
      case RescheduleAction.Decline: {
        if (user.role !== UserRole.STUDENT && user.role !== UserRole.PARENT) {
          throw new BadRequestException('Only students or parents can decline reschedules');
        }
        if (!existingException?.note) {
          throw new BadRequestException('No reschedule proposal to decline');
        }
        const payload = JSON.parse(existingException.note) as { status: string };
        if (payload.status !== 'pending') {
          throw new BadRequestException('Reschedule already resolved');
        }
        const updatedPayload = {
          ...payload,
          status: 'declined',
          declinedBy: user.id,
          declinedAt: now.toISOString(),
        };

        await this.prisma.lessonException.update({
          where: { lessonId_date: exceptionKey },
          data: {
            type: LessonExceptionType.RESCHEDULED,
            note: JSON.stringify(updatedPayload),
          },
        });

        await this.prisma.lessonOccurrence.update({
          where: { id: occurrence.id },
          data: { isCancelled: false },
        });

        await this.queue.enqueueWaitlistOffer(lessonId);
        await this.audit.record({
          studioId: lesson.studioId,
          actorId: user.id,
          entity: 'lesson',
          entityId: lesson.id,
          action: 'lesson.reschedule.declined',
          delta: {
            occurrenceId: occurrence.id,
            proposalId: dto.proposalId,
            declinedAt: updatedPayload.declinedAt,
          },
          context: { lessonId },
        });
        return updatedPayload;
      }
      default:
        throw new BadRequestException('Unsupported reschedule action');
    }
  }

  async cancelLesson(lessonId: string, user: AuthUser, dto: CancelLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { occurrences: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const occurrenceStart = new Date(dto.occurrenceStart);
    const occurrence = lesson.occurrences.find((item) => item.startTime.getTime() === occurrenceStart.getTime());

    if (!occurrence) {
      throw new NotFoundException('Occurrence not found');
    }

    const requestedAt = dto.requestedAt ? new Date(dto.requestedAt) : new Date();
    const policy = await this.getStudioPolicy(lesson.studioId);
    const outcome = this.calculateCancellationOutcome(policy, requestedAt, occurrence.startTime, dto.waivePenalty);

    await this.prisma.lessonOccurrence.update({
      where: { id: occurrence.id },
      data: { isCancelled: true },
    });

    await this.prisma.lessonException.upsert({
      where: { lessonId_date: { lessonId, date: occurrenceStart } },
      update: {
        type: LessonExceptionType.CANCELLED,
        note: JSON.stringify({
          reason: dto.reason,
          requestedBy: user.id,
          requestedAt: requestedAt.toISOString(),
          penalty: outcome,
        }),
      },
      create: {
        lessonId,
        date: occurrenceStart,
        type: LessonExceptionType.CANCELLED,
        note: JSON.stringify({
          reason: dto.reason,
          requestedBy: user.id,
          requestedAt: requestedAt.toISOString(),
          penalty: outcome,
        }),
      },
    });

    await this.queue.enqueueCancellationNotification(lessonId, occurrence.id, outcome);
    await this.audit.record({
      studioId: lesson.studioId,
      actorId: user.id,
      entity: 'lesson',
      entityId: lesson.id,
      action: 'lesson.cancelled',
      delta: {
        occurrenceId: occurrence.id,
        scheduledStart: occurrence.startTime.toISOString(),
        reason: dto.reason,
        penalty: outcome,
      },
      context: { lessonId },
    });

    return outcome;
  }

  private isBufferConflict(bufferMinutes: number, existing: { start: Date; end: Date }, incoming: { start: Date; end: Date }) {
    const bufferMs = bufferMinutes * 60 * 1000;
    const existingStart = existing.start.getTime() - bufferMs;
    const existingEnd = existing.end.getTime() + bufferMs;

    return incoming.start.getTime() < existingEnd && incoming.end.getTime() > existingStart;
  }

  private startOfISOWeek(date: Date) {
    const d = new Date(date);
    const day = d.getUTCDay() || 7;
    if (day !== 1) {
      d.setUTCDate(d.getUTCDate() + 1 - day);
    }
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  private async getStudioPolicy(studioId: string): Promise<BookingPolicy> {
    const studio = await this.prisma.studio.findUnique({ where: { id: studioId } });
    if (!studio?.bookingPolicy) {
      return DEFAULT_BOOKING_POLICY;
    }

    const raw = studio.bookingPolicy as Partial<BookingPolicy>;
    return {
      ...DEFAULT_BOOKING_POLICY,
      ...raw,
      cancellationPolicy: raw.cancellationPolicy ?? DEFAULT_BOOKING_POLICY.cancellationPolicy,
    };
  }

  private generateRecurrenceDates(start: Date, range: { start: Date; end: Date }, options: ParsedRRule) {
    const dates: Date[] = [];
    let candidate = new Date(start);
    const byDay = options.byDay?.length ? options.byDay : [start.getUTCDay()];
    const countLimit = options.count ?? Number.MAX_SAFE_INTEGER;
    const frequencyMs = this.frequencyToMs(options.freq, options.interval);
    const projectedIterations = Math.max(
      1,
      Math.ceil((range.end.getTime() - start.getTime()) / Math.max(frequencyMs, 1)) + 5,
    );
    const iterationCap = Math.min(
      10000,
      countLimit !== Number.MAX_SAFE_INTEGER
        ? countLimit * byDay.length + 5
        : projectedIterations * byDay.length,
    );

    let generated = 0;
    let iterations = 0;
    while (iterations < iterationCap) {
      if (options.until && candidate > options.until) {
        break;
      }
      if (candidate > range.end) {
        break;
      }
      if (candidate >= range.start && candidate <= range.end) {
        dates.push(new Date(candidate));
      }
      generated++;
      if (generated >= countLimit) {
        break;
      }
      const next = this.advanceOccurrence(candidate, options, start, byDay);
      if (!next || next.getTime() === candidate.getTime()) {
        break;
      }
      candidate = next;
      iterations++;
    }

    return dates;
  }

  private parseRRule(rule: string): ParsedRRule {
    const cleaned = rule.trim().toUpperCase().replace(/^RRULE:/, '');
    const segments = cleaned.split(';').filter(Boolean);
    const options: ParsedRRule = {
      freq: 'DAILY',
      interval: 1,
    };

    for (const segment of segments) {
      const [key, rawValue] = segment.split('=');
      if (!key || !rawValue) {
        continue;
      }
      const value = rawValue.trim();
      switch (key) {
        case 'FREQ':
          if (value === 'WEEKLY' || value === 'MONTHLY' || value === 'DAILY') {
            options.freq = value;
          }
          break;
        case 'COUNT': {
          const parsedCount = Number.parseInt(value, 10);
          if (!Number.isNaN(parsedCount)) {
            options.count = parsedCount;
          }
          break;
        }
        case 'INTERVAL': {
          const parsedInterval = Number.parseInt(value, 10);
          options.interval = Number.isNaN(parsedInterval) ? options.interval : Math.max(1, parsedInterval);
          break;
        }
        case 'UNTIL':
          options.until = this.parseRRuleDate(value);
          break;
        case 'BYDAY':
          options.byDay = value
            .split(',')
            .map((code) => this.mapWeekday(code))
            .filter((day): day is number => day !== undefined);
          break;
        default:
          break;
      }
    }

    return options;
  }

  private parseRRuleDate(value: string) {
    if (/^\d{8}T\d{6}Z$/.test(value)) {
      const year = Number.parseInt(value.substring(0, 4), 10);
      const month = Number.parseInt(value.substring(4, 6), 10) - 1;
      const day = Number.parseInt(value.substring(6, 8), 10);
      const hour = Number.parseInt(value.substring(9, 11), 10);
      const minute = Number.parseInt(value.substring(11, 13), 10);
      const second = Number.parseInt(value.substring(13, 15), 10);
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    }
    return new Date(value);
  }

  private advanceOccurrence(current: Date, options: ParsedRRule, seriesStart: Date, byDay: number[]) {
    const next = new Date(current);
    if (options.freq === 'DAILY') {
      next.setUTCDate(next.getUTCDate() + options.interval);
      return next;
    }

    if (options.freq === 'MONTHLY') {
      next.setUTCMonth(next.getUTCMonth() + options.interval);
      return next;
    }

    const sortedDays = [...byDay].sort((a, b) => a - b);
    const currentDay = current.getUTCDay();
    const nextDay = sortedDays.find((day) => day > currentDay);
    if (nextDay !== undefined) {
      const diff = nextDay - currentDay;
      next.setUTCDate(next.getUTCDate() + diff);
      return next;
    }

    const firstDay = sortedDays[0] ?? seriesStart.getUTCDay();
    const diffToNextWeek = 7 * options.interval - (currentDay - firstDay);
    next.setUTCDate(next.getUTCDate() + diffToNextWeek);
    return next;
  }

  private mapWeekday(code: string) {
    switch (code) {
      case 'MO':
        return 1;
      case 'TU':
        return 2;
      case 'WE':
        return 3;
      case 'TH':
        return 4;
      case 'FR':
        return 5;
      case 'SA':
        return 6;
      case 'SU':
        return 0;
      default:
        return undefined;
    }
  }

  private isWithinRange(date: Date, range: { start: Date; end: Date }) {
    return date >= range.start && date <= range.end;
  }

  private frequencyToMs(freq: ParsedRRule['freq'], interval: number) {
    const dayMs = 24 * 60 * 60 * 1000;
    switch (freq) {
      case 'DAILY':
        return interval * dayMs;
      case 'WEEKLY':
        return interval * 7 * dayMs;
      case 'MONTHLY':
        return interval * 30 * dayMs;
      default:
        return dayMs;
    }
  }

  private parseExceptionNote(note?: string) {
    if (!note) {
      return {} as Record<string, unknown>;
    }
    try {
      return JSON.parse(note) as Record<string, unknown>;
    } catch (error) {
      return {} as Record<string, unknown>;
    }
  }
}
