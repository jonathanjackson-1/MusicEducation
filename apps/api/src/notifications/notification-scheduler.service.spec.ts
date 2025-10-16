import { NotificationSchedulerService } from './scheduler/notification-scheduler.service';

const jobs: any[] = [];
const prisma: any = {
  notificationJob: {
    create: jest.fn().mockImplementation(async ({ data }: any) => {
      const job = { id: `job-${jobs.length + 1}`, ...data };
      jobs.push(job);
      return job;
    }),
  },
};

describe('NotificationSchedulerService', () => {
  const scheduler = new NotificationSchedulerService(prisma);

  beforeEach(() => {
    jobs.splice(0, jobs.length);
    prisma.notificationJob.create.mockClear();
  });

  it('schedules lesson reminder jobs with offsets', async () => {
    const startAt = new Date('2024-04-22T15:30:00.000Z');
    const result = await scheduler.scheduleLessonReminders({
      studioId: 'studio-1',
      lessonId: 'lesson-1',
      startAt,
      recipients: ['student-1', 'educator-1'],
      reminderOffsetsHours: [24, 1],
      context: { lessonDate: 'April 22', lessonTime: '3:30 PM' },
    });

    expect({
      result: result.map((job: any) => ({
        ...job,
        runAt: job.runAt.toISOString(),
      })),
      persisted: jobs.map((job) => ({
        ...job,
        runAt: job.runAt.toISOString(),
      })),
    }).toMatchSnapshot();
  });

  it('schedules overdue assignment nudge', async () => {
    const dueAt = new Date('2024-04-21T17:00:00.000Z');
    const job = await scheduler.scheduleOverdueAssignmentNudge({
      studioId: 'studio-1',
      assignmentId: 'assignment-1',
      userId: 'student-1',
      dueAt,
      nudgeDays: 2,
      context: { assignmentTitle: 'Chromatic Scales' },
    });

    expect({
      job: { ...job, runAt: job.runAt.toISOString() },
    }).toMatchSnapshot();
  });

  it('schedules weekly practice summary', async () => {
    const weekOf = new Date('2024-04-15T00:00:00.000Z');
    const job = await scheduler.scheduleWeeklyPracticeSummary({
      studioId: 'studio-1',
      userId: 'student-1',
      weekOf,
      context: { totalMinutes: 210 },
    });

    expect({
      job: { ...job, runAt: job.runAt.toISOString() },
    }).toMatchSnapshot();
  });
});
