import { DataRequestType } from '@prisma/client';
import { ConsentService } from './consent.service';
import { PrivacyQueueService } from './privacy-queue.service';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { UserRole } from '../common/interfaces/user-role.enum';

describe('ConsentService flows', () => {
  const prisma = {
    consent: {
      upsert: jest.fn().mockResolvedValue({ id: 'consent-1' }),
    },
    dataRequest: {
      create: jest.fn().mockResolvedValue({
        id: 'request-1',
        studioId: 'studio-1',
        subjectId: 'student-1',
        requestedById: 'admin-1',
        type: DataRequestType.EXPORT,
      }),
      findMany: jest.fn(),
    },
  } as any;

  const queue: PrivacyQueueService = {
    enqueueDataRequest: jest.fn().mockResolvedValue(null),
  } as any;

  const service = new ConsentService(prisma, queue);

  const admin: AuthUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    studioId: 'studio-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records parental consent with guardian metadata', async () => {
    await service.recordParentalConsent(admin, {
      minorId: 'student-1',
      guardianId: 'parent-1',
      relationship: 'mother',
      granted: true,
    });

    expect(prisma.consent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          studioId_subjectId_type: {
            studioId: 'studio-1',
            subjectId: 'student-1',
            type: 'parental',
          },
        },
        update: expect.objectContaining({
          guardianRelationship: 'mother',
          grantedById: 'parent-1',
        }),
      }),
    );
  });

  it('queues data subject requests for background processing', async () => {
    const request = await service.createDataRequest(admin, {
      subjectId: 'student-1',
      type: DataRequestType.EXPORT,
      reason: 'Parent requested copy',
      payload: { includeGrades: true },
    });

    expect(queue.enqueueDataRequest).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'request-1', type: DataRequestType.EXPORT }),
    );
    expect(request.id).toBe('request-1');
  });
});
