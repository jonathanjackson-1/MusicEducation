import { SchedulingService } from '../scheduling.service';
import { UserRole } from '../../common/interfaces/user-role.enum';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RescheduleAction } from '../dto/reschedule-lesson.dto';

const baseLesson = {
  id: 'lesson-1',
  studioId: 'studio-1',
  occurrences: [
    {
      id: 'occ-1',
      lessonId: 'lesson-1',
      startTime: new Date('2024-04-10T15:00:00Z'),
      endTime: new Date('2024-04-10T15:30:00Z'),
      isCancelled: false,
    },
  ],
  exceptions: [],
};

describe('SchedulingService - reschedule flow', () => {
  const educator: AuthUser = {
    id: 'educator-1',
    email: 'educator@example.com',
    role: UserRole.EDUCATOR,
    studioId: 'studio-1',
  };

  const student: AuthUser = {
    id: 'student-1',
    email: 'student@example.com',
    role: UserRole.STUDENT,
    studioId: 'studio-1',
  };

  const queue = {
    enqueueLessonReminder: jest.fn(),
    enqueueRescheduleFollowUp: jest.fn(),
    enqueueWaitlistOffer: jest.fn(),
    enqueueCancellationNotification: jest.fn(),
    enqueueCalendarReconciliation: jest.fn(),
  } as any;

  const audit = {
    record: jest.fn().mockResolvedValue(null),
  } as any;

  const prisma = {
    lesson: {
      findUnique: jest.fn().mockImplementation(async () => ({
        ...baseLesson,
        occurrences: baseLesson.occurrences.map((occurrence) => ({ ...occurrence })),
        exceptions: [...baseLesson.exceptions],
      })),
    },
    lessonException: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
    },
    lessonOccurrence: {
      update: jest
        .fn()
        .mockResolvedValueOnce({
          id: 'occ-1',
          lessonId: 'lesson-1',
          startTime: new Date('2024-04-10T15:00:00Z'),
          endTime: new Date('2024-04-10T15:30:00Z'),
          isCancelled: true,
        })
        .mockResolvedValueOnce({
          id: 'occ-1',
          lessonId: 'lesson-1',
          startTime: new Date('2024-04-12T16:00:00Z'),
          endTime: new Date('2024-04-12T16:30:00Z'),
          isCancelled: false,
        }),
    },
    studio: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'studio-1',
        bookingPolicy: {
          minLeadMinutes: 30,
          maxBookingsPerWeek: 10,
          bufferMinutes: 15,
          autoConfirm: true,
          rescheduleWindowHours: 2,
          cancellationPolicy: [],
        },
      }),
    },
  } as any;

  let service: SchedulingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SchedulingService(prisma, queue, audit);
  });

  it('allows educator to propose and student to accept a reschedule', async () => {
    const originalStart = new Date('2024-04-10T15:00:00Z').toISOString();

    const proposalPayload = await service.rescheduleLesson('lesson-1', educator, {
      action: RescheduleAction.Propose,
      originalStart,
      proposals: [
        { id: 'slot-1', startTime: '2024-04-12T16:00:00Z', endTime: '2024-04-12T16:30:00Z' },
      ],
    });

    expect(proposalPayload.status).toBe('pending');
    expect(prisma.lessonException.upsert).toHaveBeenCalled();
    expect(queue.enqueueRescheduleFollowUp).toHaveBeenCalledWith('lesson-1', 'occ-1');

    const storedNote = JSON.stringify(proposalPayload);
    prisma.lessonException.findUnique.mockResolvedValueOnce({
      lessonId: 'lesson-1',
      date: new Date(originalStart),
      note: storedNote,
    });

    const updatedOccurrence = await service.rescheduleLesson('lesson-1', student, {
      action: RescheduleAction.Accept,
      originalStart,
      proposalId: 'slot-1',
    });

    expect(updatedOccurrence.startTime.toISOString()).toBe('2024-04-12T16:00:00.000Z');
    expect(queue.enqueueLessonReminder).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'lesson.reschedule.accepted',
        entity: 'lesson',
      }),
    );
  });
});
