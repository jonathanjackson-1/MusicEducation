import {
  PracticeGoalLike,
  PracticeLogLike,
  addUtcDays,
  calculateGoalProgress,
  calculateStreak,
  countConsecutiveWeeksBelowGoal,
  startOfUtcWeek,
} from './practice.utils';

describe('practice utils', () => {
  const goalBase: PracticeGoalLike = {
    startDate: new Date(Date.UTC(2024, 0, 1)),
    weeklyTargetMinutes: 120,
    vacationRanges: [],
    pieceTargets: [],
  };

  it('calculates goal progress for weekly and per-piece targets', () => {
    const goal: PracticeGoalLike = {
      ...goalBase,
      pieceTargets: [
        { pieceId: 'piece-a', targetMinutes: 200, piece: { id: 'piece-a', title: 'Etude in C' } },
        { pieceId: 'piece-b', targetMinutes: 100, piece: { id: 'piece-b', title: 'Nocturne' } },
      ],
    };

    const logs: PracticeLogLike[] = [
      { practicedAt: addUtcDays(goal.startDate, 1), durationMinutes: 60, pieceId: 'piece-a' },
      { practicedAt: addUtcDays(goal.startDate, 2), durationMinutes: 50, pieceId: 'piece-a' },
      { practicedAt: addUtcDays(goal.startDate, 4), durationMinutes: 30, pieceId: 'piece-b' },
      { practicedAt: addUtcDays(goal.startDate, 8), durationMinutes: 40, pieceId: 'piece-a' },
    ];

    const now = new Date(Date.UTC(2024, 0, 10));
    const progress = calculateGoalProgress(logs, goal, now);

    expect(progress.weekly).toEqual({
      targetMinutes: 120,
      actualMinutes: 40,
      remainingMinutes: 80,
    });

    expect(progress.pieces).toEqual([
      {
        pieceId: 'piece-a',
        targetMinutes: 200,
        actualMinutes: 150,
        remainingMinutes: 50,
        piece: { id: 'piece-a', title: 'Etude in C' },
      },
      {
        pieceId: 'piece-b',
        targetMinutes: 100,
        actualMinutes: 30,
        remainingMinutes: 70,
        piece: { id: 'piece-b', title: 'Nocturne' },
      },
    ]);
  });

  it('computes streaks while skipping vacation weeks', () => {
    const vacationStart = addUtcDays(goalBase.startDate, 7);
    const vacationEnd = addUtcDays(goalBase.startDate, 13);
    const goal: PracticeGoalLike = {
      ...goalBase,
      vacationRanges: [{ start: vacationStart, end: vacationEnd }],
    };

    const week1 = startOfUtcWeek(goal.startDate);
    const week2 = addUtcDays(week1, 7);
    const week3 = addUtcDays(week2, 7);

    const weekly = new Map<string, number>([
      [week1.toISOString(), 140],
      [week2.toISOString(), 0],
      [week3.toISOString(), 150],
    ]);

    const now = addUtcDays(week3, 3);
    const streak = calculateStreak(weekly, goal, now);

    expect(streak).toEqual({ current: 2, longest: 2 });
  });

  it('counts consecutive weeks below goal ignoring vacations', () => {
    const vacationStart = addUtcDays(goalBase.startDate, 7);
    const vacationEnd = addUtcDays(goalBase.startDate, 13);
    const goal: PracticeGoalLike = {
      ...goalBase,
      vacationRanges: [{ start: vacationStart, end: vacationEnd }],
    };

    const week1 = startOfUtcWeek(goal.startDate);
    const week2 = addUtcDays(week1, 7);
    const week3 = addUtcDays(week2, 7);

    const weekly = new Map<string, number>([
      [week1.toISOString(), 90],
      [week2.toISOString(), 0],
      [week3.toISOString(), 100],
    ]);

    const now = addUtcDays(week3, 2);
    const below = countConsecutiveWeeksBelowGoal(weekly, goal, now);

    expect(below).toBe(2);
  });
});
