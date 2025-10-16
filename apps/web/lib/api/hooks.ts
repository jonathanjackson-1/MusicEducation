'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

import { ApiClient, createApiClient } from './client';
import type {
  Assignment,
  AvailabilityBlock,
  BookingRequest,
  CalendarEvent,
  ChildSummary,
  Invoice,
  PracticeGoal,
  PracticeStreak,
  StudentAssignment,
  StudentPracticeMetric,
  StudentScheduleItem
} from './client';

const createClient = (accessToken?: string) =>
  createApiClient({ accessToken, getAccessToken: async () => accessToken });

export const useApiClient = () => {
  const { data: session } = useSession();
  return useMemo<ApiClient>(() => createClient(session?.accessToken), [session?.accessToken]);
};

export const useEducatorCalendar = (studioId?: string) => {
  const client = useApiClient();
  return useQuery<CalendarEvent[]>({
    queryKey: ['educator', 'calendar', studioId],
    enabled: Boolean(studioId),
    queryFn: () => client.getEducatorCalendar(studioId!)
  });
};

export const useCreateAvailability = (studioId?: string) => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<AvailabilityBlock, 'id'>) =>
      client.createAvailability(studioId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educator', 'calendar', studioId] });
    }
  });
};

export const useEducatorAssignments = (studioId?: string) => {
  const client = useApiClient();
  return useQuery<Assignment[]>({
    queryKey: ['educator', 'assignments', studioId],
    enabled: Boolean(studioId),
    queryFn: () => client.getEducatorAssignments(studioId!)
  });
};

export const usePracticeAnalytics = (studioId?: string) => {
  const client = useApiClient();
  return useQuery<StudentPracticeMetric[]>({
    queryKey: ['educator', 'students', studioId],
    enabled: Boolean(studioId),
    queryFn: () => client.getPracticeAnalytics(studioId!)
  });
};

export const useStudentSchedule = (studioId?: string) => {
  const client = useApiClient();
  return useQuery<StudentScheduleItem[]>({
    queryKey: ['student', 'schedule', studioId],
    enabled: Boolean(studioId),
    queryFn: () => client.getStudentSchedule(studioId!)
  });
};

export const useStudentAssignments = (studioId?: string) => {
  const client = useApiClient();
  return useQuery<StudentAssignment[]>({
    queryKey: ['student', 'assignments', studioId],
    enabled: Boolean(studioId),
    queryFn: () => client.getStudentAssignments(studioId!)
  });
};

export const useSubmitAssignment = (studioId?: string) => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, ...payload }: { assignmentId: string; comment?: string; fileUrl?: string }) =>
      client.submitAssignment(studioId!, assignmentId, payload),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student', 'assignments', studioId] });
      queryClient.invalidateQueries({
        queryKey: ['student', 'assignment', studioId, variables.assignmentId]
      });
    }
  });
};

export const usePracticeGoal = (studioId?: string) => {
  const client = useApiClient();
  return useQuery<PracticeGoal>({
    queryKey: ['student', 'practice-goal', studioId],
    enabled: Boolean(studioId),
    queryFn: () => client.getPracticeGoal(studioId!)
  });
};

export const useLogPracticeSession = (studioId?: string) => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { minutes: number; notes?: string }) =>
      client.logPracticeSession(studioId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'practice-goal', studioId] });
      queryClient.invalidateQueries({ queryKey: ['student', 'streaks', studioId] });
    }
  });
};

export const usePracticeStreak = (studioId?: string) => {
  const client = useApiClient();
  return useQuery<PracticeStreak>({
    queryKey: ['student', 'streaks', studioId],
    enabled: Boolean(studioId),
    queryFn: () => client.getPracticeStreak(studioId!)
  });
};

export const useChildrenOverview = (studioId?: string) => {
  const client = useApiClient();
  return useQuery<ChildSummary[]>({
    queryKey: ['parent', 'children', studioId],
    enabled: Boolean(studioId),
    queryFn: () => client.getParentChildren(studioId!)
  });
};

export const useBookingRequests = (studioId?: string) => {
  const client = useApiClient();
  return useQuery<BookingRequest[]>({
    queryKey: ['parent', 'booking-requests', studioId],
    enabled: Boolean(studioId),
    queryFn: () => client.getBookingRequests(studioId!)
  });
};

export const useRespondToBooking = (studioId?: string) => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { bookingId: string; action: 'approve' | 'decline' }) =>
      client.respondToBooking(studioId!, payload.bookingId, payload.action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent', 'booking-requests', studioId] });
    }
  });
};

export const useInvoices = (studioId?: string) => {
  const client = useApiClient();
  return useQuery<Invoice[]>({
    queryKey: ['parent', 'invoices', studioId],
    enabled: Boolean(studioId),
    queryFn: () => client.getInvoices(studioId!)
  });
};

export const useUpdateStudio = () => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studioId: string) => client.updateActiveStudio(studioId),
    onSuccess: (_, studioId) => {
      queryClient.invalidateQueries();
      queryClient.setQueryData(['session', 'activeStudio'], studioId);
    }
  });
};

