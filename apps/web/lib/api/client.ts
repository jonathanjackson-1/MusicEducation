import { z } from 'zod';

import {
  availabilityBlockSchema,
  bookingRequestSchema,
  calendarEventSchema,
  childSummarySchema,
  assignmentSchema,
  invoiceSchema,
  loginResponseSchema,
  practiceGoalSchema,
  sessionUserSchema,
  streakSchema,
  studentAssignmentSchema,
  studentPracticeMetricSchema,
  studentScheduleItemSchema,
  updateStudioResponseSchema,
  type Assignment,
  type AvailabilityBlock,
  type BookingRequest,
  type CalendarEvent,
  type ChildSummary,
  type Invoice,
  type PracticeGoal,
  type PracticeStreak,
  type SessionUser,
  type StudentAssignment,
  type StudentPracticeMetric,
  type StudentScheduleItem,
  type UserRole
} from './schemas';
import {
  mockAssignments,
  mockBookingRequests,
  mockCalendarEvents,
  mockChildren,
  mockInvoices,
  mockPracticeGoal,
  mockStreak,
  mockStudentAssignments,
  mockStudentSchedule,
  mockStudents,
  mockUser
} from './mock-data';

const jsonHeaders = { 'Content-Type': 'application/json' } as const;

export interface ApiClientOptions {
  baseUrl?: string;
  accessToken?: string;
  getAccessToken?: () => Promise<string | undefined>;
}

const resolveBaseUrl = (explicit?: string) =>
  explicit ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? '';

export class ApiClient {
  private readonly baseUrl: string;
  private readonly accessToken?: string;
  private readonly getAccessToken?: () => Promise<string | undefined>;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = resolveBaseUrl(options.baseUrl);
    this.accessToken = options.accessToken;
    this.getAccessToken = options.getAccessToken;
  }

  private async withHeaders(init?: RequestInit): Promise<HeadersInit> {
    const headers = new Headers(init?.headers ?? jsonHeaders);
    const token = this.accessToken ?? (await this.getAccessToken?.());
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    schema: z.ZodSchema<T>,
    fallback: () => T | Promise<T>
  ): Promise<T> {
    const shouldUseApi = Boolean(this.baseUrl);
    if (!shouldUseApi) {
      return fallback();
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: await this.withHeaders(init)
      });
      if (!response.ok) {
        throw new Error(`API request failed (${response.status})`);
      }
      const data = await response.json();
      return schema.parse(data);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Falling back to mock data for ${path}`, error);
      }
      return fallback();
    }
  }

  async login(email: string, password: string): Promise<{ token: string; user: SessionUser }> {
    return this.request(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password })
      },
      loginResponseSchema,
      async () => ({ token: 'mock-token', user: mockUser })
    );
  }

  async me(): Promise<SessionUser> {
    return this.request(
      '/auth/me',
      { method: 'GET' },
      sessionUserSchema,
      async () => mockUser
    );
  }

  async getEducatorCalendar(studioId: string): Promise<CalendarEvent[]> {
    return this.request(
      `/studios/${studioId}/educator/calendar`,
      { method: 'GET' },
      z.array(calendarEventSchema),
      async () => mockCalendarEvents
    );
  }

  async createAvailability(
    studioId: string,
    availability: Omit<AvailabilityBlock, 'id'>
  ): Promise<AvailabilityBlock> {
    return this.request(
      `/studios/${studioId}/educator/availability`,
      {
        method: 'POST',
        body: JSON.stringify(availability)
      },
      availabilityBlockSchema,
      async () => ({ ...availability, id: `availability-${Date.now()}` })
    );
  }

  async getEducatorAssignments(studioId: string): Promise<Assignment[]> {
    return this.request(
      `/studios/${studioId}/educator/assignments`,
      { method: 'GET' },
      z.array(assignmentSchema),
      async () => mockAssignments
    );
  }

  async getPracticeAnalytics(studioId: string): Promise<StudentPracticeMetric[]> {
    return this.request(
      `/studios/${studioId}/educator/students/practice`,
      { method: 'GET' },
      z.array(studentPracticeMetricSchema),
      async () => mockStudents
    );
  }

  async getStudentSchedule(studioId: string): Promise<StudentScheduleItem[]> {
    return this.request(
      `/studios/${studioId}/student/schedule`,
      { method: 'GET' },
      z.array(studentScheduleItemSchema),
      async () => mockStudentSchedule
    );
  }

  async getStudentAssignments(studioId: string): Promise<StudentAssignment[]> {
    return this.request(
      `/studios/${studioId}/student/assignments`,
      { method: 'GET' },
      z.array(studentAssignmentSchema),
      async () => mockStudentAssignments
    );
  }

  async submitAssignment(
    studioId: string,
    assignmentId: string,
    payload: { comment?: string; fileUrl?: string }
  ): Promise<StudentAssignment> {
    return this.request(
      `/studios/${studioId}/student/assignments/${assignmentId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      studentAssignmentSchema,
      async () => ({
        ...(mockStudentAssignments.find((assignment) => assignment.id === assignmentId) ??
          mockStudentAssignments[0]),
        status: 'submitted'
      })
    );
  }

  async getPracticeGoal(studioId: string): Promise<PracticeGoal> {
    return this.request(
      `/studios/${studioId}/student/practice-goal`,
      { method: 'GET' },
      practiceGoalSchema,
      async () => mockPracticeGoal
    );
  }

  async logPracticeSession(
    studioId: string,
    payload: { minutes: number; notes?: string }
  ): Promise<PracticeGoal> {
    return this.request(
      `/studios/${studioId}/student/practice-sessions`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      practiceGoalSchema,
      async () => ({
        ...mockPracticeGoal,
        minutesPracticed: mockPracticeGoal.minutesPracticed + payload.minutes,
        remainingMinutes: Math.max(
          0,
          mockPracticeGoal.weeklyMinutesGoal -
            (mockPracticeGoal.minutesPracticed + payload.minutes)
        )
      })
    );
  }

  async getPracticeStreak(studioId: string): Promise<PracticeStreak> {
    return this.request(
      `/studios/${studioId}/student/streaks`,
      { method: 'GET' },
      streakSchema,
      async () => mockStreak
    );
  }

  async getParentChildren(studioId: string): Promise<ChildSummary[]> {
    return this.request(
      `/studios/${studioId}/parent/children`,
      { method: 'GET' },
      z.array(childSummarySchema),
      async () => mockChildren
    );
  }

  async getBookingRequests(studioId: string): Promise<BookingRequest[]> {
    return this.request(
      `/studios/${studioId}/parent/booking-requests`,
      { method: 'GET' },
      z.array(bookingRequestSchema),
      async () => mockBookingRequests
    );
  }

  async respondToBooking(
    studioId: string,
    bookingId: string,
    action: 'approve' | 'decline'
  ): Promise<BookingRequest> {
    return this.request(
      `/studios/${studioId}/parent/booking-requests/${bookingId}`,
      {
        method: 'POST',
        body: JSON.stringify({ action })
      },
      bookingRequestSchema,
      async () => ({
        ...(mockBookingRequests.find((request) => request.id === bookingId) ??
          mockBookingRequests[0]),
        status: action === 'approve' ? 'approved' : 'declined'
      })
    );
  }

  async getInvoices(studioId: string): Promise<Invoice[]> {
    return this.request(
      `/studios/${studioId}/parent/invoices`,
      { method: 'GET' },
      z.array(invoiceSchema),
      async () => mockInvoices
    );
  }

  async updateActiveStudio(studioId: string): Promise<{ activeStudioId: string }> {
    return this.request(
      '/auth/active-studio',
      {
        method: 'POST',
        body: JSON.stringify({ studioId })
      },
      updateStudioResponseSchema,
      async () => ({ activeStudioId: studioId })
    );
  }
}

export const apiClient = new ApiClient();

export const createApiClient = (options: ApiClientOptions = {}) => new ApiClient(options);

export type { Assignment, AvailabilityBlock, BookingRequest, CalendarEvent, ChildSummary, Invoice, PracticeGoal, PracticeStreak, SessionUser, StudentAssignment, StudentPracticeMetric, StudentScheduleItem, UserRole };

