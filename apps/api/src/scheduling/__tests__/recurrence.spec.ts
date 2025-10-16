import { SchedulingService } from '../scheduling.service';

describe('SchedulingService - recurrence expansion', () => {
  let service: SchedulingService;

  beforeEach(() => {
    const prisma = {} as any;
    const queue = {
      enqueueLessonReminder: jest.fn(),
      enqueueRescheduleFollowUp: jest.fn(),
      enqueueWaitlistOffer: jest.fn(),
      enqueueCancellationNotification: jest.fn(),
      enqueueCalendarReconciliation: jest.fn(),
    } as any;
    service = new SchedulingService(prisma, queue);
  });

  it('expands recurrence series with cancellations and reschedules', () => {
    const start = new Date('2024-01-01T15:00:00Z');
    const end = new Date('2024-01-01T15:30:00Z');
    const rangeStart = new Date('2023-12-31T00:00:00Z');
    const rangeEnd = new Date('2024-01-20T00:00:00Z');

    const occurrences = service.expandRecurrenceSeries(
      {
        start,
        end,
        recurrenceRule: 'FREQ=WEEKLY;COUNT=3',
        exceptions: [
          { date: start.toISOString(), type: 'CANCELLED' },
          {
            date: new Date('2024-01-08T15:00:00Z').toISOString(),
            type: 'RESCHEDULED',
            newStart: '2024-01-09T16:00:00Z',
            newEnd: '2024-01-09T16:30:00Z',
          },
        ],
      },
      { start: rangeStart, end: rangeEnd },
    );

    expect(occurrences).toHaveLength(3);
    expect(occurrences[0].status).toBe('cancelled');
    expect(occurrences[0].start.toISOString()).toBe(start.toISOString());

    const rescheduled = occurrences.find((item) => item.status === 'rescheduled');
    expect(rescheduled).toBeDefined();
    expect(rescheduled?.start.toISOString()).toBe('2024-01-09T16:00:00.000Z');
    expect(rescheduled?.originalStart?.toISOString()).toBe('2024-01-08T15:00:00.000Z');
  });
});
