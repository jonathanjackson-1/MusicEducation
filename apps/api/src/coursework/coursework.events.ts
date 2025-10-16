export const CourseworkEvents = {
  AssignmentCreated: 'coursework.assignment.created',
  SubmissionReceived: 'coursework.submission.received',
  AssignmentGraded: 'coursework.assignment.graded',
} as const;

type CourseworkEventKeys = keyof typeof CourseworkEvents;
export type CourseworkEvent = (typeof CourseworkEvents)[CourseworkEventKeys];
