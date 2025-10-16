import { EventEmitter2 } from '@nestjs/event-emitter';
import { GradeType, SubmissionStatus } from '@prisma/client';
import { CourseworkService } from '../coursework.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { UserRole } from '../../common/interfaces/user-role.enum';

describe('CourseworkService audit logging', () => {
  const prisma = {
    submission: {
      findUnique: jest
        .fn()
        .mockResolvedValueOnce({
          id: 'sub-1',
          studioId: 'studio-1',
          assignmentId: 'assign-1',
          assignment: {
            id: 'assign-1',
            rubric: { id: 'rubric-1', studioId: 'studio-1', gradingType: GradeType.NUMERIC },
          },
          grade: null,
        })
        .mockResolvedValue({ id: 'sub-1', grade: { id: 'grade-1' } }),
      update: jest.fn().mockResolvedValue({ id: 'sub-1', status: SubmissionStatus.GRADED }),
    },
    rubric: {
      findUnique: jest.fn(),
    },
    grade: {
      upsert: jest.fn().mockResolvedValue({
        id: 'grade-1',
        submissionId: 'sub-1',
        score: 95,
        result: null,
        feedback: 'Great job',
        rubricId: 'rubric-1',
      }),
    },
  } as any;

  const storage = {} as any;
  const antivirus = {} as any;
  const events = { emit: jest.fn() } as unknown as EventEmitter2;
  const audit = { record: jest.fn().mockResolvedValue(null) } as any;

  const service = new CourseworkService(prisma, storage, antivirus, events, audit);

  const educator: AuthUser = {
    id: 'educator-1',
    email: 'educator@example.com',
    role: UserRole.EDUCATOR,
    studioId: 'studio-1',
  };

  it('records an audit log when a grade is created', async () => {
    await service.gradeSubmission(educator, 'sub-1', {
      score: 95,
      feedback: 'Great job',
    });

    expect(prisma.grade.upsert).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'grade.created',
        entity: 'grade',
        entityId: 'grade-1',
        studioId: 'studio-1',
      }),
    );
  });
});
