import { z } from 'zod';

export const userRoleSchema = z.enum(['educator', 'student', 'parent']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const studioSchema = z.object({
  id: z.string(),
  name: z.string()
});
export type Studio = z.infer<typeof studioSchema>;

export const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  avatarUrl: z.string().url().optional(),
  studios: z.array(studioSchema),
  activeStudioId: z.string()
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  studentName: z.string().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'availability']).default('scheduled'),
  type: z.enum(['lesson', 'practice', 'availability']).default('lesson')
});
export type CalendarEvent = z.infer<typeof calendarEventSchema>;

export const availabilityBlockSchema = z.object({
  id: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime()
});
export type AvailabilityBlock = z.infer<typeof availabilityBlockSchema>;

export const rubricCriterionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  maxScore: z.number().int().positive(),
  weight: z.number().min(0).max(1).default(1)
});
export type RubricCriterion = z.infer<typeof rubricCriterionSchema>;

export const assignmentTemplateSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  rubric: z.array(rubricCriterionSchema)
});
export type AssignmentTemplate = z.infer<typeof assignmentTemplateSchema>;

export const assignmentSubmissionSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  submittedAt: z.string().datetime(),
  fileUrl: z.string().url().optional(),
  audioUrl: z.string().url().optional(),
  feedback: z.string().optional(),
  grade: z.number().min(0).max(100).optional(),
  rubricScores: z
    .array(
      z.object({
        criterionId: z.string(),
        score: z.number().min(0).max(100)
      })
    )
    .optional()
});
export type AssignmentSubmission = z.infer<typeof assignmentSubmissionSchema>;

export const assignmentSchema = z.object({
  id: z.string(),
  templateId: z.string().optional(),
  title: z.string(),
  description: z.string(),
  dueDate: z.string().datetime(),
  attachments: z.array(z.string().url()).optional(),
  rubric: z.array(rubricCriterionSchema).optional(),
  submissions: z.array(assignmentSubmissionSchema).optional()
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const studentPracticeMetricSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  minutesPracticedThisWeek: z.number(),
  minutesGoal: z.number(),
  streakLength: z.number().int().nonnegative(),
  badgeEarned: z.string().optional()
});
export type StudentPracticeMetric = z.infer<typeof studentPracticeMetricSchema>;

export const practiceGoalSchema = z.object({
  weeklyMinutesGoal: z.number(),
  minutesPracticed: z.number(),
  remainingMinutes: z.number()
});
export type PracticeGoal = z.infer<typeof practiceGoalSchema>;

export const streakSchema = z.object({
  current: z.number().int().nonnegative(),
  longest: z.number().int().nonnegative(),
  badges: z.array(z.object({ id: z.string(), label: z.string(), earnedAt: z.string().datetime() }))
});
export type PracticeStreak = z.infer<typeof streakSchema>;

export const studentAssignmentSchema = z.object({
  id: z.string(),
  title: z.string(),
  dueDate: z.string().datetime(),
  description: z.string(),
  status: z.enum(['pending', 'submitted', 'graded']).default('pending'),
  grade: z.number().optional(),
  feedback: z.string().optional()
});
export type StudentAssignment = z.infer<typeof studentAssignmentSchema>;

export const studentScheduleItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  type: z.enum(['lesson', 'practice', 'event']).default('lesson'),
  educatorName: z.string().optional()
});
export type StudentScheduleItem = z.infer<typeof studentScheduleItemSchema>;

export const childSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.string(),
  nextLesson: z.string().datetime().optional(),
  weeklyProgressMinutes: z.number(),
  weeklyGoalMinutes: z.number()
});
export type ChildSummary = z.infer<typeof childSummarySchema>;

export const bookingRequestSchema = z.object({
  id: z.string(),
  studentName: z.string(),
  requestedAt: z.string().datetime(),
  requestedSlot: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  status: z.enum(['pending', 'approved', 'declined']).default('pending')
});
export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export const invoiceSchema = z.object({
  id: z.string(),
  amount: z.number(),
  issuedAt: z.string().datetime(),
  dueAt: z.string().datetime(),
  status: z.enum(['open', 'paid', 'overdue']).default('open'),
  downloadUrl: z.string().url()
});
export type Invoice = z.infer<typeof invoiceSchema>;

export const loginResponseSchema = z.object({
  token: z.string(),
  user: sessionUserSchema
});

export const updateStudioResponseSchema = z.object({
  activeStudioId: z.string()
});

