import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { CreateAssignmentTemplateDto } from './dto/create-assignment-template.dto';
import { UpdateAssignmentTemplateDto } from './dto/update-assignment-template.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { UserRole } from '../common/interfaces/user-role.enum';

@Injectable()
export class CourseworkService {
  constructor(private readonly prisma: PrismaService) {}

  createTemplate(studioId: string, dto: CreateAssignmentTemplateDto) {
    return this.prisma.assignmentTemplate.create({
      data: {
        ...dto,
        studioId,
      },
    });
  }

  updateTemplate(id: string, dto: UpdateAssignmentTemplateDto) {
    return this.prisma.assignmentTemplate.update({ where: { id }, data: dto });
  }

  listTemplates() {
    return this.prisma.assignmentTemplate.findMany();
  }

  createAssignment(user: AuthUser, dto: CreateAssignmentDto) {
    return this.prisma.assignment.create({
      data: {
        ...dto,
        studioId: user.studioId,
        assignedById: user.id,
      },
      include: { submissions: true },
    });
  }

  updateAssignment(id: string, dto: UpdateAssignmentDto) {
    return this.prisma.assignment.update({ where: { id }, data: dto });
  }

  listAssignmentsForUser(user: AuthUser) {
    if (user.role === UserRole.STUDENT) {
      return this.prisma.assignment.findMany({
        where: { assignedToId: user.id },
        include: { submissions: true },
      });
    }

    return this.prisma.assignment.findMany({ include: { submissions: true } });
  }

  createSubmission(user: AuthUser, dto: CreateSubmissionDto) {
    return this.prisma.submission.create({
      data: {
        ...dto,
        studioId: user.studioId,
        submittedById: user.id,
      },
      include: { grade: true },
    });
  }
}
