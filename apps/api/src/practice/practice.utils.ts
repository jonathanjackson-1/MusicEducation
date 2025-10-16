export interface PracticeLogLike {
  practicedAt: Date;
  durationMinutes: number;
  pieceId?: string | null;
}

export interface VacationRange {
  start: Date;
  end: Date;
}

export interface PracticeGoalLike {
  startDate: Date;
  endDate?: Date | null;
  weeklyTargetMinutes: number;
  vacationRanges?: VacationRange[];
  pieceTargets?: PracticeGoalPieceTargetLike[];
}

export interface PracticeGoalPieceTargetLike {
  pieceId: string;
  targetMinutes: number;
  piece?: { id: string; title: string } | null;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function startOfUtcWeek(date: Date): Date {
  const start = startOfUtcDay(date);
  const day = start.getUTCDay();
  const diff = (day + 6) % 7; // Monday as start of week
  start.setUTCDate(start.getUTCDate() - diff);
  return start;
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function parseVacationRanges(raw: unknown): VacationRange[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const ranges: VacationRange[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const startValue = (entry as { start?: string }).start;
    const endValue = (entry as { end?: string }).end;

    if (!startValue || !endValue) {
      continue;
    }

    const startDate = new Date(startValue);
    const endDate = new Date(endValue);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      continue;
    }

    if (endDate.getTime() < startDate.getTime()) {
      continue;
    }

    ranges.push({ start: startDate, end: endDate });
  }

  return ranges;
}

export function aggregateWeeklyMinutes(
  logs: PracticeLogLike[],
  options?: { startDate?: Date; endDate?: Date },
): Map<string, number> {
  const weeklyTotals = new Map<string, number>();

  for (const log of logs) {
    if (options?.startDate && log.practicedAt < options.startDate) {
      continue;
    }
    if (options?.endDate && log.practicedAt > options.endDate) {
      continue;
    }

    const weekStart = startOfUtcWeek(log.practicedAt).toISOString();
    const existing = weeklyTotals.get(weekStart) ?? 0;
    weeklyTotals.set(weekStart, existing + Math.max(0, log.durationMinutes));
  }

  return weeklyTotals;
}

function isVacationWeek(
  weekStart: Date,
  vacations: VacationRange[],
): boolean {
  if (!vacations.length) {
    return false;
  }

  const weekEnd = addUtcDays(weekStart, 7);
  return vacations.some((vacation) => {
    const vacStart = startOfUtcDay(vacation.start);
    const vacEnd = startOfUtcDay(vacation.end);
    return vacStart <= weekEnd && vacEnd >= weekStart;
  });
}

function enumerateWeeks(start: Date, end: Date): Date[] {
  const weeks: Date[] = [];
  let cursor = startOfUtcWeek(start);
  const last = startOfUtcWeek(end);

  while (cursor.getTime() <= last.getTime()) {
    weeks.push(new Date(cursor.getTime()));
    cursor = addUtcDays(cursor, 7);
  }

  return weeks;
}

export function calculateStreak(
  weeklyMinutes: Map<string, number>,
  goal: PracticeGoalLike,
  now: Date = new Date(),
): { current: number; longest: number } {
  if (!goal.weeklyTargetMinutes) {
    return { current: 0, longest: 0 };
  }

  const effectiveEnd = goal.endDate && goal.endDate < now ? goal.endDate : now;
  if (effectiveEnd < goal.startDate) {
    return { current: 0, longest: 0 };
  }

  const vacations = goal.vacationRanges ?? [];
  const weeks = enumerateWeeks(goal.startDate, effectiveEnd);

  let longest = 0;
  let running = 0;
  for (const weekStart of weeks) {
    if (isVacationWeek(weekStart, vacations)) {
      continue;
    }

    const minutes = weeklyMinutes.get(weekStart.toISOString()) ?? 0;
    if (minutes >= goal.weeklyTargetMinutes) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  let current = 0;
  for (let index = weeks.length - 1; index >= 0; index -= 1) {
    const weekStart = weeks[index];
    if (isVacationWeek(weekStart, vacations)) {
      continue;
    }

    const minutes = weeklyMinutes.get(weekStart.toISOString()) ?? 0;
    if (minutes >= goal.weeklyTargetMinutes) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, longest };
}

export function calculateGoalProgress(
  logs: PracticeLogLike[],
  goal: PracticeGoalLike,
  now: Date = new Date(),
): {
  weekly: { targetMinutes: number; actualMinutes: number; remainingMinutes: number };
  pieces: Array<{
    pieceId: string;
    targetMinutes: number;
    actualMinutes: number;
    remainingMinutes: number;
    piece?: { id: string; title: string } | null;
  }>;
} {
  const effectiveEnd = goal.endDate && goal.endDate < now ? goal.endDate : now;
  const activeLogs = logs.filter((log) => {
    if (log.practicedAt < goal.startDate) {
      return false;
    }
    if (effectiveEnd && log.practicedAt > effectiveEnd) {
      return false;
    }
    return true;
  });

  const weekStart = startOfUtcWeek(effectiveEnd ?? now);
  const weekEnd = addUtcDays(weekStart, 7);

  const weeklyActual = activeLogs.reduce((total, log) => {
    if (log.practicedAt >= weekStart && log.practicedAt < weekEnd) {
      return total + Math.max(0, log.durationMinutes);
    }
    return total;
  }, 0);

  const pieces = (goal.pieceTargets ?? []).map((target) => {
    const actualMinutes = activeLogs.reduce((total, log) => {
      if (log.pieceId === target.pieceId) {
        return total + Math.max(0, log.durationMinutes);
      }
      return total;
    }, 0);

    const remainingMinutes = Math.max(target.targetMinutes - actualMinutes, 0);

    return {
      pieceId: target.pieceId,
      targetMinutes: target.targetMinutes,
      actualMinutes,
      remainingMinutes,
      piece: target.piece ?? null,
    };
  });

  return {
    weekly: {
      targetMinutes: goal.weeklyTargetMinutes,
      actualMinutes: weeklyActual,
      remainingMinutes: Math.max(goal.weeklyTargetMinutes - weeklyActual, 0),
    },
    pieces,
  };
}

export function countConsecutiveWeeksBelowGoal(
  weeklyMinutes: Map<string, number>,
  goal: PracticeGoalLike,
  now: Date = new Date(),
): number {
  if (!goal.weeklyTargetMinutes) {
    return 0;
  }

  const effectiveEnd = goal.endDate && goal.endDate < now ? goal.endDate : now;
  if (effectiveEnd < goal.startDate) {
    return 0;
  }

  const vacations = goal.vacationRanges ?? [];
  const weeks = enumerateWeeks(goal.startDate, effectiveEnd);

  let consecutive = 0;
  for (let index = weeks.length - 1; index >= 0; index -= 1) {
    const weekStart = weeks[index];
    if (isVacationWeek(weekStart, vacations)) {
      continue;
    }

    const minutes = weeklyMinutes.get(weekStart.toISOString()) ?? 0;
    if (minutes < goal.weeklyTargetMinutes) {
      consecutive += 1;
    } else {
      break;
    }
  }

  return consecutive;
}
