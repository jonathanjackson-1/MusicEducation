import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  ApiResponse,
  Assignment,
  Lesson,
  LessonLevel,
  Plan,
  PlansResponse,
  PracticeLog,
  PracticeLogsResponse,
  User,
  UsersResponse
} from '..';

describe('types', () => {
  it('allows valid lesson levels', () => {
    const levels: LessonLevel[] = ['beginner', 'intermediate', 'advanced'];
    expect(levels).toHaveLength(3);
  });

  it('describes the User shape', () => {
    expectTypeOf<User>().toMatchTypeOf({
      id: '',
      email: '',
      name: '',
      role: 'student',
      joinedAt: '',
      avatarUrl: null,
      preferredInstrument: null,
      timezone: null
    });
  });

  it('represents a paginated response with pagination metadata', () => {
    const response: UsersResponse = {
      data: [
        {
          id: 'user_1',
          email: 'student@example.com',
          name: 'Student',
          role: 'student',
          joinedAt: new Date().toISOString()
        }
      ],
      meta: {
        servedAt: new Date().toISOString(),
        pagination: {
          page: 1,
          perPage: 10,
          totalItems: 1,
          totalPages: 1
        }
      }
    };

    expect(response.meta.pagination.totalItems).toBe(1);
  });

  it('keeps API response data generic', () => {
    const lesson: Lesson = {
      id: 'lesson_1',
      title: 'Warm Ups',
      level: 'beginner',
      durationMinutes: 15,
      description: 'Daily warm up routine',
      instructorId: 'teacher_1'
    };

    const response: ApiResponse<Lesson> = {
      data: lesson,
      meta: { servedAt: new Date().toISOString() }
    };

    expect(response.data.title).toBe('Warm Ups');
  });

  it('captures plan collection payloads', () => {
    const plan: Plan = {
      id: 'plan_pro',
      name: 'Pro Studio',
      priceCents: 1999,
      currency: 'USD',
      interval: 'monthly',
      features: ['Unlimited lessons']
    };

    const response: PlansResponse = {
      data: [plan],
      meta: { servedAt: new Date().toISOString() }
    };

    expect(response.data[0].id).toBe('plan_pro');
  });

  it('describes practice log responses', () => {
    const log: PracticeLog = {
      id: 'log_1',
      userId: 'user_1',
      assignmentId: 'assignment_1',
      startedAt: new Date().toISOString(),
      durationMinutes: 30
    };

    const response: PracticeLogsResponse = {
      data: [log],
      meta: {
        servedAt: new Date().toISOString(),
        pagination: { page: 1, perPage: 25, totalItems: 1, totalPages: 1 }
      }
    };

    expect(response.data[0].durationMinutes).toBe(30);
  });

  it('ensures assignments allow optional status', () => {
    const assignment: Assignment = {
      id: 'assignment_1',
      lessonId: 'lesson_1',
      title: 'Daily practice',
      instructions: 'Practice scales for 15 minutes',
      availableAt: new Date().toISOString(),
      status: 'pending'
    };

    expect(assignment.status).toBe('pending');
  });
});
