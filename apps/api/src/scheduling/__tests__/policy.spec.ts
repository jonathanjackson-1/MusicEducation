import { BadRequestException } from '@nestjs/common';
import { SchedulingService } from '../scheduling.service';

const createService = () => {
  const prisma = {} as any;
  const queue = {
    enqueueLessonReminder: jest.fn(),
    enqueueRescheduleFollowUp: jest.fn(),
    enqueueWaitlistOffer: jest.fn(),
    enqueueCancellationNotification: jest.fn(),
    enqueueCalendarReconciliation: jest.fn(),
  } as any;
  const audit = { record: jest.fn().mockResolvedValue(null) } as any;
  return new SchedulingService(prisma, queue, audit);
};

describe('SchedulingService - booking policy validation', () => {
  it('validates booking with sufficient lead time and buffer', () => {
    const service = createService();
    const now = new Date('2024-03-01T10:00:00Z');
    const start = new Date('2024-03-02T12:00:00Z');
    const end = new Date('2024-03-02T13:00:00Z');

    const result = service.validateBookingAgainstPolicy({
      now,
      requestedStart: start,
      requestedEnd: end,
      studentId: 'student-1',
      existingOccurrences: [
        {
          start: new Date('2024-03-02T09:00:00Z'),
          end: new Date('2024-03-02T10:00:00Z'),
          studentId: 'student-1',
        },
      ],
      policy: {
        minLeadMinutes: 60,
        maxBookingsPerWeek: 3,
        bufferMinutes: 30,
        autoConfirm: false,
        rescheduleWindowHours: 12,
        cancellationPolicy: [],
      },
    });

    expect(result).toEqual({ status: 'pending-approval', autoConfirm: false });
  });

  it('throws when booking violates lead time requirement', () => {
    const service = createService();
    const now = new Date('2024-03-01T10:00:00Z');
    const start = new Date('2024-03-01T10:30:00Z');
    const end = new Date('2024-03-01T11:00:00Z');

    expect(() =>
      service.validateBookingAgainstPolicy({
        now,
        requestedStart: start,
        requestedEnd: end,
        studentId: 'student-1',
        existingOccurrences: [],
        policy: {
          minLeadMinutes: 60,
          maxBookingsPerWeek: 3,
          bufferMinutes: 15,
          autoConfirm: true,
          rescheduleWindowHours: 12,
          cancellationPolicy: [],
        },
      }),
    ).toThrow(BadRequestException);
  });
});
