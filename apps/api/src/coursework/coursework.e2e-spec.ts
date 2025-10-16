import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { CourseworkModule } from './coursework.module';
import { PrismaService } from '../prisma/prisma.service';
import { SubmissionStorageService } from './submission-storage.service';
import { AntivirusService } from './antivirus.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserRole } from '../common/interfaces/user-role.enum';
import { GradeType, SubmissionStatus } from '@prisma/client';

class TestAuthGuard implements CanActivate {
  constructor(private readonly roleHeader = 'x-test-role') {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const roleHeader = (request.headers[this.roleHeader] as string | undefined)?.toUpperCase();
    const role = (roleHeader && UserRole[roleHeader as keyof typeof UserRole]) ?? UserRole.STUDENT;
    const user =
      role === UserRole.EDUCATOR || role === UserRole.ADMIN
        ? { id: 'educator-1', studioId: 'studio-1', role }
        : { id: 'student-1', studioId: 'studio-1', role };
    request.user = user;
    return true;
  }
}

type AssignmentRecord = {
  id: string;
  studioId: string;
  assignedById: string;
  rubricId?: string;
  ensembleId?: string | null;
  autoReminders: number[];
  recipients: { userId: string; assignmentId: string }[];
  rubric?: { id: string; studioId: string; gradingType: GradeType } | null;
};

type SubmissionRecord = {
  id: string;
  assignmentId: string;
  studioId: string;
  submittedById: string;
  textResponse?: string | null;
  notes?: any;
  status: SubmissionStatus;
  attachments: any[];
  grade: any | null;
};

class InMemoryPrismaService {
  private assignments = new Map<string, AssignmentRecord>();
  private submissions = new Map<string, SubmissionRecord>();
  private rubrics = new Map<string, { id: string; studioId: string; gradingType: GradeType }>();
  private gradeStore = new Map<string, any>();

  assignmentRecipient = {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  };

  constructor() {
    const rubric = { id: 'rubric-1', studioId: 'studio-1', gradingType: GradeType.NUMERIC };
    this.rubrics.set(rubric.id, rubric);
    const assignment: AssignmentRecord = {
      id: 'assignment-1',
      studioId: 'studio-1',
      assignedById: 'educator-1',
      rubricId: rubric.id,
      autoReminders: [],
      recipients: [{ assignmentId: 'assignment-1', userId: 'student-1' }],
      rubric,
      ensembleId: null,
    };
    this.assignments.set(assignment.id, assignment);
  }

  private cloneAssignment(record: AssignmentRecord, include: any = {}) {
    return {
      ...record,
      recipients: include?.recipients ? [...record.recipients] : undefined,
      rubric: include?.rubric ? record.rubric ?? (record.rubricId ? this.rubrics.get(record.rubricId) ?? null : null) : undefined,
      submissions: include?.submissions ? this.getAssignmentSubmissions(record.id) : undefined,
      template: include?.template ? null : undefined,
    };
  }

  private getAssignmentSubmissions(assignmentId: string) {
    return Array.from(this.submissions.values()).filter((submission) => submission.assignmentId === assignmentId);
  }

  assignment = {
    findUnique: jest.fn(({ where, include }: any) => {
      const record = where?.id ? this.assignments.get(where.id) : undefined;
      if (!record) {
        return null;
      }
      return this.cloneAssignment(record, include);
    }),
    findMany: jest.fn(({ where, include }: any = {}) => {
      const results = Array.from(this.assignments.values()).filter((assignment) => {
        if (where?.studioId && assignment.studioId !== where.studioId) {
          return false;
        }
        if (where?.ensembleId && assignment.ensembleId !== where.ensembleId) {
          return false;
        }
        if (where?.recipients?.some) {
          const userId = where.recipients.some.userId;
          return assignment.recipients.some((recipient) => recipient.userId === userId);
        }
        return true;
      });
      return results.map((record) => this.cloneAssignment(record, include));
    }),
    create: jest.fn(({ data }: any) => {
      const record: AssignmentRecord = {
        id: `assignment-${this.assignments.size + 1}`,
        studioId: data.studioId,
        assignedById: data.assignedById,
        rubricId: data.rubricId,
        ensembleId: data.ensembleId ?? null,
        autoReminders: data.autoReminders ?? [],
        recipients: [],
        rubric: data.rubricId ? this.rubrics.get(data.rubricId) ?? null : null,
      };
      this.assignments.set(record.id, record);
      return record;
    }),
    update: jest.fn(({ where, data }: any) => {
      const record = this.assignments.get(where.id);
      if (!record) {
        throw new Error('Assignment not found');
      }
      Object.assign(record, data);
      return this.cloneAssignment(record);
    }),
  };

  submissionAttachment = {
    createMany: jest.fn(({ data }: any) => {
      data.forEach((attachment: any) => {
        const submission = this.submissions.get(attachment.submissionId);
        if (submission) {
          submission.attachments.push({
            id: `attachment-${submission.attachments.length + 1}`,
            submissionId: attachment.submissionId,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            size: attachment.size,
            storageKey: attachment.storageKey,
            url: attachment.url,
            createdAt: new Date(),
          });
        }
      });
      return { count: data.length };
    }),
  };

  submission = {
    create: jest.fn(({ data }: any) => {
      const submission: SubmissionRecord = {
        id: `submission-${this.submissions.size + 1}`,
        assignmentId: data.assignmentId,
        studioId: data.studioId,
        submittedById: data.submittedById,
        textResponse: data.textResponse ?? null,
        notes: data.notes ?? null,
        status: data.status,
        attachments: [],
        grade: null,
      };
      this.submissions.set(submission.id, submission);
      return submission;
    }),
    findUnique: jest.fn(({ where, include }: any) => {
      const submission = where?.id ? this.submissions.get(where.id) : undefined;
      if (!submission) {
        return null;
      }
      const record = {
        ...submission,
        attachments: include?.attachments ? [...submission.attachments] : undefined,
        grade: include?.grade ? submission.grade : undefined,
        assignment: include?.assignment
          ? {
              ...this.assignments.get(submission.assignmentId)!,
              rubric: include.assignment.include?.rubric
                ? this.assignments.get(submission.assignmentId)!.rubric ?? null
                : undefined,
            }
          : undefined,
      };
      return record;
    }),
    update: jest.fn(({ where, data }: any) => {
      const submission = this.submissions.get(where.id);
      if (!submission) {
        throw new Error('Submission not found');
      }
      Object.assign(submission, data);
      return submission;
    }),
  };

  grade = {
    upsert: jest.fn(({ where, create, update }: any) => {
      const existing = this.gradeStore.get(where.submissionId);
      const record = existing
        ? { ...existing, ...update }
        : { id: `grade-${this.gradeStore.size + 1}`, ...create };
      this.gradeStore.set(where.submissionId, record);
      const submission = this.submissions.get(where.submissionId);
      if (submission) {
        submission.grade = record;
      }
      return record;
    }),
  };

  rubric = {
    findUnique: jest.fn(({ where }: any) => {
      if (!where?.id) {
        return null;
      }
      return this.rubrics.get(where.id) ?? null;
    }),
  };

  $transaction = async (handler: any) => handler(this);
}

describe('Coursework submissions (e2e)', () => {
  let app: INestApplication;
  let prisma: InMemoryPrismaService;

  beforeAll(async () => {
    prisma = new InMemoryPrismaService();
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [CourseworkModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(SubmissionStorageService)
      .useValue({
        validateFile: jest.fn(),
        upload: jest.fn().mockResolvedValue({ key: 'stored/test.mp3', url: 'https://storage.example/test.mp3' }),
      })
      .overrideProvider(AntivirusService)
      .useValue({ scan: jest.fn().mockResolvedValue(undefined) })
      .overrideGuard(JwtAuthGuard)
      .useValue(new TestAuthGuard())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts multipart submission uploads and stores attachments', async () => {
    const response = await request(app.getHttpServer())
      .post('/coursework/submissions')
      .set('x-test-role', 'student')
      .field('assignmentId', 'assignment-1')
      .field('textResponse', 'Weekly practice reflections')
      .field('notes', JSON.stringify([{ timestamp: 5, note: 'Focus on dynamics' }]))
      .attach('files', Buffer.from('audio'), 'practice.mp3')
      .expect(201);

    expect(response.body).toMatchObject({
      assignmentId: 'assignment-1',
      studioId: 'studio-1',
      status: 'SUBMITTED',
      textResponse: 'Weekly practice reflections',
    });
    expect(response.body.attachments).toHaveLength(1);
    expect(prisma.submissionAttachment.createMany).toHaveBeenCalled();
  });

  it('grades a submission with numeric score', async () => {
    const existingSubmission = Array.from((prisma as any).submissions.values())[0];
    const submissionId = existingSubmission?.id ?? 'submission-1';

    const response = await request(app.getHttpServer())
      .post(`/coursework/submissions/${submissionId}/grade`)
      .set('x-test-role', 'educator')
      .send({
        score: 92,
        feedback: 'Excellent tone quality',
      })
      .expect(201);

    expect(response.body.grade).toMatchObject({ score: 92, feedback: 'Excellent tone quality' });
    expect(response.body.status).toEqual('GRADED');
  });
});
