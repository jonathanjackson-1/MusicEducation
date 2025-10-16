import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePracticeLogDto } from './dto/create-practice-log.dto';
import { UpdatePracticeLogDto } from './dto/update-practice-log.dto';
import { CreatePracticeGoalDto } from './dto/create-practice-goal.dto';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { UserRole } from '../common/interfaces/user-role.enum';

@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  createLog(user: AuthUser, dto: CreatePracticeLogDto) {
    return this.prisma.practiceLog.create({
      data: {
        ...dto,
        studioId: user.studioId,
        studentId: user.id,
      },
    });
  }

  updateLog(id: string, dto: UpdatePracticeLogDto) {
    return this.prisma.practiceLog.update({ where: { id }, data: dto });
  }

  listLogs(user: AuthUser) {
    if (user.role === UserRole.ADMIN || user.role === UserRole.EDUCATOR) {
      return this.prisma.practiceLog.findMany();
    }
    return this.prisma.practiceLog.findMany({ where: { studentId: user.id } });
  }

  createGoal(studioId: string, dto: CreatePracticeGoalDto) {
    return this.prisma.practiceGoal.create({
      data: {
        ...dto,
        studioId,
      },
    });
  }
}
