import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Assignment, GradeType, Prisma, SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import {
  CreateAssignmentTemplateDto,
  TemplateSectionsDto,
  TemplateTagsDto,
} from './dto/create-assignment-template.dto';
import { UpdateAssignmentTemplateDto } from './dto/update-assignment-template.dto';
import { CreateSubmissionDto, TimeStampedNoteDto } from './dto/create-submission.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { UserRole } from '../common/interfaces/user-role.enum';
import { SubmissionStorageService } from './submission-storage.service';
import { AntivirusService } from './antivirus.service';
import { CourseworkEvents } from './coursework.events';

@Injectable()
export class CourseworkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SubmissionStorageService,
    private readonly antivirus: AntivirusService,
    private readonly events: EventEmitter2,
  ) {}

  private assignmentInclude() {
    return {
      recipients: true,
      submissions: {
        include: { attachments: true, grade: true },
      },
      template: true,
      rubric: true,
    } satisfies Prisma.AssignmentInclude;
  }

  private sanitizeSections(sections?: TemplateSectionsDto | null) {
    if (!sections) {
      return {};
    }

    return JSON.parse(JSON.stringify(sections));
  }

  private sanitizeTags(tags?: TemplateTagsDto | null) {
    if (!tags) {
      return {};
    }

    return JSON.parse(JSON.stringify(tags));
  }

  createTemplate(studioId: string, dto: CreateAssignmentTemplateDto) {
    return this.prisma.assignmentTemplate.create({
      data: {
        title: dto.title,
        description: dto.description,
        rubricId: dto.rubricId,
        sections: this.sanitizeSections(dto.sections),
        tags: this.sanitizeTags(dto.tags),
        studioId,
      },
    });
  }

  updateTemplate(id: string, dto: UpdateAssignmentTemplateDto) {
    const data: Prisma.AssignmentTemplateUpdateInput = {
      title: dto.title,
      description: dto.description,
      rubricId: dto.rubricId,
    };

    if (dto.sections !== undefined) {
      data.sections = this.sanitizeSections(dto.sections);
    }

    if (dto.tags !== undefined) {
      data.tags = this.sanitizeTags(dto.tags);
    }

    return this.prisma.assignmentTemplate.update({ where: { id }, data });
  }

  listTemplates(studioId: string) {
    return this.prisma.assignmentTemplate.findMany({ where: { studioId } });
  }

  async createAssignment(user: AuthUser, dto: CreateAssignmentDto) {
    const recipients = dto.recipientUserIds?.filter(Boolean) ?? [];

    if (recipients.length === 0 && !dto.ensembleId) {
      throw new BadRequestException(
        'Assignments must target at least one student or an ensemble.',
      );
    }

    const dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;

    const assignment = await this.prisma.assignment.create({
      data: {
        studioId: user.studioId,
        assignedById: user.id,
        templateId: dto.templateId,
        lessonId: dto.lessonId,
        title: dto.title,
        instructions: dto.instructions,
        dueDate,
        rubricId: dto.rubricId,
        ensembleId: dto.ensembleId,
        autoReminders: dto.autoReminderDays ?? [],
      },
    });

    if (recipients.length > 0) {
      await this.prisma.assignmentRecipient.createMany({
        data: recipients.map((recipientId) => ({
          assignmentId: assignment.id,
          userId: recipientId,
        })),
        skipDuplicates: true,
      });
    }

    const fullAssignment = await this.prisma.assignment.findUnique({
      where: { id: assignment.id },
      include: this.assignmentInclude(),
    });

    const response =
      fullAssignment ??
      (await this.prisma.assignment.findUnique({
        where: { id: assignment.id },
        include: this.assignmentInclude(),
      }));

    this.events.emit(CourseworkEvents.AssignmentCreated, {
      assignment: response,
      studioId: user.studioId,
    });

    return response;
  }

  async updateAssignment(id: string, dto: UpdateAssignmentDto) {
    const data: Prisma.AssignmentUpdateInput = {
      title: dto.title,
      instructions: dto.instructions,
      templateId: dto.templateId,
      lessonId: dto.lessonId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      rubricId: dto.rubricId,
      ensembleId: dto.ensembleId,
    };

    if (dto.autoReminderDays) {
      data.autoReminders = dto.autoReminderDays;
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.assignment.update({
        where: { id },
        data,
      });

      if (dto.recipientUserIds !== undefined) {
        await tx.assignmentRecipient.deleteMany({ where: { assignmentId: id } });
        if (dto.recipientUserIds.length > 0) {
          await tx.assignmentRecipient.createMany({
            data: dto.recipientUserIds.map((userId) => ({ assignmentId: id, userId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.assignment.findUnique({
        where: { id },
        include: this.assignmentInclude(),
      });
    });
  }

  listAssignmentsForUser(user: AuthUser) {
    if (user.role === UserRole.STUDENT || user.role === UserRole.PARENT) {
      return this.prisma.assignment.findMany({
        where: {
          studioId: user.studioId,
          recipients: { some: { userId: user.id } },
        },
        include: this.assignmentInclude(),
      });
    }

    return this.prisma.assignment.findMany({
      where: { studioId: user.studioId },
      include: this.assignmentInclude(),
    });
  }

  async listAssignmentsForStudent(requester: AuthUser, studentId: string) {
    if (
      requester.role === UserRole.STUDENT &&
      requester.id !== studentId
    ) {
      throw new ForbiddenException('Students may only view their own assignments.');
    }

    return this.prisma.assignment.findMany({
      where: {
        studioId: requester.studioId,
        recipients: { some: { userId: studentId } },
      },
      include: this.assignmentInclude(),
    });
  }

  listAssignmentsForEnsemble(requester: AuthUser, ensembleId: string) {
    if (requester.role === UserRole.STUDENT || requester.role === UserRole.PARENT) {
      throw new ForbiddenException('Ensemble assignments are limited to studio staff.');
    }

    return this.prisma.assignment.findMany({
      where: { studioId: requester.studioId, ensembleId },
      include: this.assignmentInclude(),
    });
  }

  private ensureAssignmentRecipient(assignment: Assignment & { recipients: { userId: string }[] }, user: AuthUser) {
    if (user.role === UserRole.STUDENT || user.role === UserRole.PARENT) {
      const isRecipient = assignment.recipients.some((recipient) => recipient.userId === user.id);
      if (!isRecipient) {
        throw new ForbiddenException('You are not assigned to this coursework.');
      }
    }
  }

  async createSubmission(
    user: AuthUser,
    dto: CreateSubmissionDto,
    files: Express.Multer.File[] = [],
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: dto.assignmentId },
      include: { recipients: true },
    });

    if (!assignment || assignment.studioId !== user.studioId) {
      throw new NotFoundException('Assignment not found.');
    }

    this.ensureAssignmentRecipient(assignment, user);

    const attachmentsMeta = [] as {
      storageKey: string;
      url: string;
      fileName: string;
      mimeType: string;
      size: number;
    }[];

    for (const file of files) {
      this.storage.validateFile(file);
      await this.antivirus.scan(file.buffer, file.originalname);
      const { key, url } = await this.storage.upload(file);
      attachmentsMeta.push({
        storageKey: key,
        url,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      });
    }

    const notes = (dto.notes ?? []).map((note: TimeStampedNoteDto) => ({
      timestamp: note.timestamp,
      note: note.note,
    }));

    const submission = await this.prisma.$transaction(async (tx) => {
      const created = await tx.submission.create({
        data: {
          assignmentId: dto.assignmentId,
          studioId: user.studioId,
          submittedById: user.id,
          textResponse: dto.textResponse,
          notes,
          status: SubmissionStatus.SUBMITTED,
        },
      });

      if (attachmentsMeta.length > 0) {
        await tx.submissionAttachment.createMany({
          data: attachmentsMeta.map((meta) => ({
            submissionId: created.id,
            fileName: meta.fileName,
            mimeType: meta.mimeType,
            size: meta.size,
            storageKey: meta.storageKey,
            url: meta.url,
          })),
        });
      }

      return tx.submission.findUnique({
        where: { id: created.id },
        include: { attachments: true, grade: true },
      });
    });

    if (!submission) {
      throw new NotFoundException('Submission could not be created.');
    }

    this.events.emit(CourseworkEvents.SubmissionReceived, {
      assignmentId: dto.assignmentId,
      submissionId: submission?.id,
      studioId: user.studioId,
    });

    return submission;
  }

  async gradeSubmission(
    user: AuthUser,
    submissionId: string,
    dto: GradeSubmissionDto,
  ) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.EDUCATOR) {
      throw new ForbiddenException('Only educators can grade submissions.');
    }

    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { include: { rubric: true } },
        grade: true,
      },
    });

    if (!submission || submission.studioId !== user.studioId) {
      throw new NotFoundException('Submission not found.');
    }

    const rubricId = dto.rubricId ?? submission.assignment.rubricId ?? submission.grade?.rubricId ?? undefined;

    if (rubricId) {
      const rubric = submission.assignment.rubric?.id === rubricId
        ? submission.assignment.rubric
        : await this.prisma.rubric.findUnique({ where: { id: rubricId } });

      if (!rubric) {
        throw new NotFoundException('Rubric not found for grading.');
      }

      if (rubric.studioId !== user.studioId) {
        throw new ForbiddenException('Rubric is not accessible in this studio.');
      }

      if (rubric.gradingType === GradeType.NUMERIC && dto.score === undefined) {
        throw new BadRequestException('Numeric rubrics require a score.');
      }

      if (rubric.gradingType === GradeType.PASS_FAIL && dto.result === undefined) {
        throw new BadRequestException('Pass/fail rubrics require a result.');
      }
    }

    const grade = await this.prisma.grade.upsert({
      where: { submissionId },
      update: {
        score: dto.score ?? null,
        result: dto.result ?? null,
        feedback: dto.feedback,
        rubricId: rubricId ?? null,
        gradedById: user.id,
        studioId: user.studioId,
      },
      create: {
        submissionId,
        gradedById: user.id,
        score: dto.score ?? null,
        result: dto.result ?? null,
        feedback: dto.feedback,
        studioId: user.studioId,
        rubricId: rubricId ?? null,
      },
    });

    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.GRADED },
    });

    const updatedSubmission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { attachments: true, grade: true },
    });

    this.events.emit(CourseworkEvents.AssignmentGraded, {
      submissionId,
      assignmentId: submission.assignmentId,
      studioId: user.studioId,
      grade,
    });

    return updatedSubmission;
  }
}
