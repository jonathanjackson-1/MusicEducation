import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Assignment,
  PracticeGoal,
  PracticeGoalPieceTarget,
  PracticeLog,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePracticeLogDto } from './dto/create-practice-log.dto';
import { UpdatePracticeLogDto } from './dto/update-practice-log.dto';
import { CreatePracticeGoalDto } from './dto/create-practice-goal.dto';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { UserRole } from '../common/interfaces/user-role.enum';
import { PracticeEvents } from './practice.events';
import {
  PracticeGoalLike,
  PracticeLogLike,
  aggregateWeeklyMinutes,
  addUtcDays,
  calculateGoalProgress,
  calculateStreak,
  countConsecutiveWeeksBelowGoal,
  parseVacationRanges,
  startOfUtcWeek,
} from './practice.utils';

interface PracticeLogTimingInput {
  startedAt?: string | Date;
  endedAt?: string | Date | null;
  durationMinutes?: number;
}

interface NormalizedTiming {
  startedAt: Date;
  endedAt?: Date | null;
  practicedAt: Date;
  durationMinutes: number;
}

interface StudentAssignmentSummary {
  assignment: Pick<Assignment, 'id' | 'title' | 'dueDate'>;
  totalMinutes: number;
}

type GoalWithTargets = PracticeGoal & {
  pieceTargets: (PracticeGoalPieceTarget & {
    piece: { id: string; title: string } | null;
  })[];
};

@Injectable()
export class PracticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  private normalizeTiming(input: PracticeLogTimingInput): NormalizedTiming {
    const startedAt = input.startedAt ? new Date(input.startedAt) : new Date();
    if (Number.isNaN(startedAt.getTime())) {
      throw new BadRequestException('Invalid startedAt timestamp');
    }

    let endedAt: Date | undefined | null;
    if (input.endedAt === undefined) {
      endedAt = undefined;
    } else if (input.endedAt === null) {
      endedAt = null;
    } else {
      endedAt = new Date(input.endedAt);
    }

    if (endedAt instanceof Date && Number.isNaN(endedAt.getTime())) {
      throw new BadRequestException('Invalid endedAt timestamp');
    }

    let durationMinutes = Math.max(0, input.durationMinutes ?? 0);

    if (endedAt instanceof Date && endedAt.getTime() < startedAt.getTime()) {
      throw new BadRequestException('endedAt must be after startedAt');
    }

    if (endedAt instanceof Date && input.durationMinutes === undefined) {
      durationMinutes = Math.max(
        0,
        Math.round((endedAt.getTime() - startedAt.getTime()) / 60000),
      );
    }

    if (endedAt === undefined && input.durationMinutes !== undefined) {
      endedAt = new Date(startedAt.getTime() + durationMinutes * 60000);
    }

    const practicedAt = endedAt instanceof Date ? endedAt : startedAt;

    return {
      startedAt,
      endedAt: endedAt instanceof Date ? endedAt : null,
      practicedAt,
      durationMinutes,
    };
  }

  private normalizeUpdatedTiming(
    existing: PracticeLog,
    dto: UpdatePracticeLogDto,
  ): NormalizedTiming {
    const startedAt = dto.startedAt ? new Date(dto.startedAt) : existing.startedAt;
    if (Number.isNaN(startedAt.getTime())) {
      throw new BadRequestException('Invalid startedAt timestamp');
    }

    const providedEnd =
      dto.endedAt === undefined
        ? undefined
        : dto.endedAt === null
        ? null
        : new Date(dto.endedAt);

    if (providedEnd instanceof Date && Number.isNaN(providedEnd.getTime())) {
      throw new BadRequestException('Invalid endedAt timestamp');
    }

    let endedAt: Date | null | undefined;
    if (providedEnd === undefined) {
      endedAt = existing.endedAt;
    } else if (providedEnd === null) {
      endedAt = null;
    } else {
      endedAt = providedEnd;
    }

    if (endedAt && endedAt.getTime() < startedAt.getTime()) {
      throw new BadRequestException('endedAt must be after startedAt');
    }

    let durationMinutes = dto.durationMinutes ?? existing.durationMinutes;

    if (endedAt && dto.durationMinutes === undefined && dto.startedAt) {
      durationMinutes = Math.max(
        0,
        Math.round((endedAt.getTime() - startedAt.getTime()) / 60000),
      );
    }

    if (!endedAt && dto.durationMinutes !== undefined) {
      endedAt = new Date(startedAt.getTime() + durationMinutes * 60000);
    }

    if (endedAt && dto.durationMinutes === undefined && !dto.startedAt && !dto.endedAt) {
      durationMinutes = Math.max(
        0,
        Math.round((endedAt.getTime() - startedAt.getTime()) / 60000),
      );
    }

    const practicedAt = endedAt ?? startedAt;

    return {
      startedAt,
      endedAt: endedAt ?? null,
      practicedAt,
      durationMinutes: Math.max(0, durationMinutes),
    };
  }

  private toGoalLike(goal: GoalWithTargets): PracticeGoalLike {
    return {
      startDate: goal.startDate,
      endDate: goal.endDate,
      weeklyTargetMinutes: goal.weeklyTargetMinutes,
      vacationRanges: parseVacationRanges(goal.vacationRanges as unknown),
      pieceTargets: goal.pieceTargets.map((target) => ({
        pieceId: target.pieceId,
        targetMinutes: target.targetMinutes,
        piece: target.piece
          ? { id: target.piece.id, title: target.piece.title }
          : null,
      })),
    };
  }

  private toPracticeLogLike(log: PracticeLog): PracticeLogLike {
    return {
      practicedAt: log.practicedAt,
      durationMinutes: log.durationMinutes,
      pieceId: log.pieceId,
    };
  }

  private emitPracticeLogged(log: PracticeLog) {
    if (!log.endedAt) {
      return;
    }

    this.events.emit(PracticeEvents.PracticeLogged, {
      studioId: log.studioId,
      studentId: log.studentId,
      logId: log.id,
      durationMinutes: log.durationMinutes,
    });
  }

  async createLog(user: AuthUser, dto: CreatePracticeLogDto) {
    const timing = this.normalizeTiming({
      startedAt: dto.startedAt,
      endedAt: dto.endedAt,
      durationMinutes: dto.durationMinutes,
    });

    const log = await this.prisma.practiceLog.create({
      data: {
        studioId: user.studioId,
        studentId: user.id,
        pieceId: dto.pieceId,
        instrumentId: dto.instrumentId,
        practiceGoalId: dto.practiceGoalId,
        assignmentId: dto.assignmentId,
        notes: dto.notes,
        category: dto.category,
        startedAt: timing.startedAt,
        endedAt: timing.endedAt ?? undefined,
        practicedAt: timing.practicedAt,
        durationMinutes: timing.durationMinutes,
      },
      include: {
        assignment: true,
        piece: true,
      },
    });

    this.emitPracticeLogged(log);

    return log;
  }

  async updateLog(id: string, dto: UpdatePracticeLogDto) {
    const existing = await this.prisma.practiceLog.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Practice log not found');
    }

    const timing = this.normalizeUpdatedTiming(existing, dto);

    const log = await this.prisma.practiceLog.update({
      where: { id },
      data: {
        pieceId: dto.pieceId,
        instrumentId: dto.instrumentId,
        practiceGoalId: dto.practiceGoalId,
        assignmentId: dto.assignmentId,
        notes: dto.notes,
        category: dto.category,
        startedAt: timing.startedAt,
        endedAt: timing.endedAt ?? undefined,
        practicedAt: timing.practicedAt,
        durationMinutes: timing.durationMinutes,
      },
      include: {
        assignment: true,
        piece: true,
      },
    });

    this.emitPracticeLogged(log);

    return log;
  }

  listLogs(user: AuthUser) {
    const query: Prisma.PracticeLogFindManyArgs = {
      where: {},
      orderBy: { practicedAt: 'desc' },
      include: {
        assignment: true,
        piece: true,
      },
    };

    if (user.role === UserRole.ADMIN || user.role === UserRole.EDUCATOR) {
      query.where = { studioId: user.studioId };
    } else {
      query.where = { studentId: user.id, studioId: user.studioId };
    }

    return this.prisma.practiceLog.findMany(query);
  }

  async createGoal(studioId: string, dto: CreatePracticeGoalDto) {
    if (dto.endDate && new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('endDate must be after startDate');
    }

    return this.prisma.practiceGoal.create({
      data: {
        studioId,
        studentId: dto.studentId,
        title: dto.title,
        description: dto.description,
        weeklyTargetMinutes: dto.weeklyTargetMinutes,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        vacationRanges: dto.vacations?.map((vacation) => ({
          start: vacation.start,
          end: vacation.end,
        })),
        pieceTargets: dto.pieceTargets
          ? {
              create: dto.pieceTargets.map((target) => ({
                pieceId: target.pieceId,
                targetMinutes: target.targetMinutes,
              })),
            }
          : undefined,
      },
      include: {
        pieceTargets: {
          include: { piece: true },
        },
      },
    });
  }

  private ensureStudentScope(user: AuthUser, studentId?: string): string {
    if (user.role === UserRole.STUDENT || user.role === UserRole.PARENT) {
      if (studentId && studentId !== user.id) {
        throw new ForbiddenException('Cannot access analytics for other students');
      }
      return user.id;
    }

    if (!studentId) {
      throw new BadRequestException('studentId is required');
    }

    return studentId;
  }

  private buildAssignmentSummaries(
    assignments: StudentAssignmentSummary[],
    logs: (PracticeLog & { assignment: Assignment | null })[],
  ) {
    const map = new Map<string, StudentAssignmentSummary>();
    assignments.forEach((assignment) => {
      map.set(assignment.assignment.id, {
        assignment: assignment.assignment,
        totalMinutes: assignment.totalMinutes,
      });
    });

    logs.forEach((log) => {
      if (!log.assignmentId) {
        return;
      }

      const existing = map.get(log.assignmentId);
      if (existing) {
        existing.totalMinutes += log.durationMinutes;
      } else if (log.assignment) {
        map.set(log.assignmentId, {
          assignment: {
            id: log.assignment.id,
            title: log.assignment.title,
            dueDate: log.assignment.dueDate,
          },
          totalMinutes: log.durationMinutes,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const dueA = a.assignment.dueDate?.getTime() ?? 0;
      const dueB = b.assignment.dueDate?.getTime() ?? 0;
      if (dueA && dueB) {
        return dueA - dueB;
      }
      if (dueA) {
        return -1;
      }
      if (dueB) {
        return 1;
      }
      return a.assignment.title.localeCompare(b.assignment.title);
    });
  }

  async getStudentAnalytics(user: AuthUser, studentId?: string) {
    const targetStudentId = this.ensureStudentScope(user, studentId);

    const [logs, goal, assignments] = await Promise.all([
      this.prisma.practiceLog.findMany({
        where: { studioId: user.studioId, studentId: targetStudentId },
        orderBy: { practicedAt: 'desc' },
        include: { assignment: true, piece: true },
      }),
      this.prisma.practiceGoal.findFirst({
        where: { studioId: user.studioId, studentId: targetStudentId },
        orderBy: { startDate: 'desc' },
        include: { pieceTargets: { include: { piece: true } } },
      }),
      this.prisma.assignment.findMany({
        where: {
          studioId: user.studioId,
          recipients: { some: { userId: targetStudentId } },
        },
        select: { id: true, title: true, dueDate: true },
      }),
    ]);

    const practiceLike = logs.map((log) => this.toPracticeLogLike(log));

    let goalLike: PracticeGoalLike | null = null;
    let goalProgress:
      | ReturnType<typeof calculateGoalProgress>
      | null = null;
    let weeklyTotals = aggregateWeeklyMinutes(practiceLike);

    if (goal) {
      goalLike = this.toGoalLike(goal as GoalWithTargets);
      weeklyTotals = aggregateWeeklyMinutes(practiceLike, {
        startDate: goalLike.startDate,
        endDate: goalLike.endDate ?? undefined,
      });
      goalProgress = calculateGoalProgress(practiceLike, goalLike);
    }

    const streak = goalLike
      ? calculateStreak(weeklyTotals, goalLike)
      : { current: 0, longest: 0 };

    const timeVsAssignments = this.buildAssignmentSummaries(
      assignments.map((assignment) => ({
        assignment,
        totalMinutes: 0,
      })),
      logs,
    ).map((entry) => ({
      assignmentId: entry.assignment.id,
      title: entry.assignment.title,
      dueDate: entry.assignment.dueDate,
      totalMinutes: entry.totalMinutes,
    }));

    const pieceMap = new Map<
      string,
      { pieceId: string | null; title: string | null; totalMinutes: number }
    >();

    logs.forEach((log) => {
      const key = log.pieceId ?? 'unassigned';
      const entry = pieceMap.get(key);
      if (entry) {
        entry.totalMinutes += log.durationMinutes;
      } else {
        pieceMap.set(key, {
          pieceId: log.pieceId ?? null,
          title: log.piece ? log.piece.title : null,
          totalMinutes: log.durationMinutes,
        });
      }
    });

    const perPieceDistribution = Array.from(pieceMap.values()).sort(
      (a, b) => b.totalMinutes - a.totalMinutes,
    );

    return {
      goal: goal
        ? {
            id: goal.id,
            title: goal.title,
            description: goal.description,
            startDate: goal.startDate,
            endDate: goal.endDate,
            weeklyTargetMinutes: goal.weeklyTargetMinutes,
            vacations: goal.vacationRanges,
            progress: goalProgress,
          }
        : null,
      streak,
      timeVsAssignments,
      perPieceDistribution,
    };
  }

  async getEducatorAnalytics(user: AuthUser, weeksBelowGoal = 2) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.EDUCATOR) {
      throw new ForbiddenException('Educator analytics restricted');
    }

    const students = await this.prisma.user.findMany({
      where: { studioId: user.studioId, role: UserRole.STUDENT },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!students.length) {
      return { cohortHeatmap: [], needsIntervention: [] };
    }

    const studentIds = students.map((student) => student.id);

    const [logs, goals] = await Promise.all([
      this.prisma.practiceLog.findMany({
        where: { studioId: user.studioId, studentId: { in: studentIds } },
        select: {
          studentId: true,
          practicedAt: true,
          durationMinutes: true,
        },
      }),
      this.prisma.practiceGoal.findMany({
        where: { studioId: user.studioId, studentId: { in: studentIds } },
        orderBy: { startDate: 'desc' },
        include: { pieceTargets: { include: { piece: true } } },
      }),
    ]);

    const logsByStudent = new Map<string, PracticeLogLike[]>();
    logs.forEach((log) => {
      const existing = logsByStudent.get(log.studentId);
      const entry = {
        practicedAt: log.practicedAt,
        durationMinutes: log.durationMinutes,
      } satisfies PracticeLogLike;
      if (existing) {
        existing.push(entry);
      } else {
        logsByStudent.set(log.studentId, [entry]);
      }
    });

    const goalMap = new Map<string, GoalWithTargets>();
    goals.forEach((goal) => {
      if (!goalMap.has(goal.studentId)) {
        goalMap.set(goal.studentId, goal as GoalWithTargets);
      }
    });

    const now = new Date();
    const currentWeek = startOfUtcWeek(now);
    const weeks: Date[] = [];
    const weeksToInclude = 8;
    for (let index = weeksToInclude - 1; index >= 0; index -= 1) {
      weeks.push(addUtcDays(currentWeek, -7 * index));
    }

    const cohortHeatmap = students.map((student) => {
      const practice = logsByStudent.get(student.id) ?? [];
      const weekly = aggregateWeeklyMinutes(practice);
      const weekEntries = weeks.map((weekStart) => ({
        weekStart: weekStart.toISOString(),
        minutes: weekly.get(weekStart.toISOString()) ?? 0,
      }));

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        weeks: weekEntries,
      };
    });

    const needsIntervention = students
      .map((student) => {
        const goal = goalMap.get(student.id);
        if (!goal) {
          return null;
        }

        const goalLike = this.toGoalLike(goal);
        const practice = logsByStudent.get(student.id) ?? [];
        const weekly = aggregateWeeklyMinutes(practice, {
          startDate: goalLike.startDate,
          endDate: goalLike.endDate ?? undefined,
        });
        const consecutive = countConsecutiveWeeksBelowGoal(
          weekly,
          goalLike,
          now,
        );

        if (consecutive >= weeksBelowGoal) {
          return {
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`.trim(),
            consecutiveWeeks: consecutive,
            weeklyTargetMinutes: goalLike.weeklyTargetMinutes,
            goalId: goal.id,
          };
        }

        return null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => b.consecutiveWeeks - a.consecutiveWeeks);

    return {
      cohortHeatmap,
      needsIntervention,
    };
  }
}
