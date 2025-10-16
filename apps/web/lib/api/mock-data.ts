import { addDays, addHours, formatISO } from 'date-fns';

import type {
  Assignment,
  AssignmentSubmission,
  BookingRequest,
  CalendarEvent,
  ChildSummary,
  Invoice,
  PracticeGoal,
  PracticeStreak,
  RubricCriterion,
  SessionUser,
  StudentAssignment,
  StudentPracticeMetric,
  StudentScheduleItem,
  Studio
} from './schemas';

const today = new Date();

const studios: Studio[] = [
  { id: 'studio-1', name: 'Downtown Studio' },
  { id: 'studio-2', name: 'Lakeside Studio' }
];

export const mockUser: SessionUser = {
  id: 'user-1',
  name: 'Jamie Rivera',
  email: 'jamie@example.com',
  role: 'educator',
  studios,
  activeStudioId: studios[0].id,
  avatarUrl: 'https://avatars.dicebear.com/api/initials/JR.svg'
};

const baseEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Piano lesson — Alex',
    start: formatISO(addHours(today, 2)),
    end: formatISO(addHours(today, 3)),
    studentName: 'Alex Morgan',
    status: 'scheduled',
    type: 'lesson',
    description: 'Focus on arpeggios and sight reading.'
  },
  {
    id: 'event-2',
    title: 'Violin lesson — Priya',
    start: formatISO(addHours(today, 5)),
    end: formatISO(addHours(today, 6)),
    studentName: 'Priya Khatri',
    status: 'scheduled',
    type: 'lesson'
  },
  {
    id: 'event-3',
    title: 'Studio availability',
    start: formatISO(addHours(today, 8)),
    end: formatISO(addHours(today, 9)),
    status: 'availability',
    type: 'availability'
  }
];

export const mockCalendarEvents: CalendarEvent[] = [
  ...baseEvents,
  ...baseEvents.map((event, index) => ({
    ...event,
    id: `event-future-${index}`,
    start: formatISO(addDays(new Date(event.start), 1)),
    end: formatISO(addDays(new Date(event.end), 1))
  }))
];

const rubric: RubricCriterion[] = [
  {
    id: 'tone',
    label: 'Tone Quality',
    description: 'Control, color, and consistency of tone.',
    maxScore: 5,
    weight: 0.4
  },
  {
    id: 'rhythm',
    label: 'Rhythmic Accuracy',
    description: 'Maintains pulse, subdivisions, and tempo.',
    maxScore: 5,
    weight: 0.3
  },
  {
    id: 'musicianship',
    label: 'Musicianship',
    description: 'Dynamics, phrasing, articulation, and expression.',
    maxScore: 5,
    weight: 0.3
  }
];

const submissions: AssignmentSubmission[] = [
  {
    id: 'submission-1',
    studentId: 'student-1',
    submittedAt: formatISO(addDays(today, -1)),
    audioUrl: 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3',
    fileUrl: 'https://example.com/assignment.pdf',
    feedback: 'Beautiful articulation in the B section — keep refining transitions.',
    grade: 92,
    rubricScores: [
      { criterionId: 'tone', score: 90 },
      { criterionId: 'rhythm', score: 95 },
      { criterionId: 'musicianship', score: 92 }
    ]
  }
];

export const mockAssignments: Assignment[] = [
  {
    id: 'assignment-1',
    title: 'Debussy - Clair de Lune',
    description: 'Focus on dynamic shading and rubato in the middle section.',
    dueDate: formatISO(addDays(today, 3)),
    attachments: ['https://example.com/reference.pdf'],
    rubric,
    submissions
  },
  {
    id: 'assignment-2',
    title: 'Major Scales Assessment',
    description: 'Record each major scale at 90bpm, two octaves.',
    dueDate: formatISO(addDays(today, 7)),
    rubric
  }
];

export const mockStudents: StudentPracticeMetric[] = [
  {
    id: 'student-1',
    studentId: 'student-1',
    studentName: 'Alex Morgan',
    minutesPracticedThisWeek: 180,
    minutesGoal: 200,
    streakLength: 12,
    badgeEarned: 'Arpeggio Ace'
  },
  {
    id: 'student-2',
    studentId: 'student-2',
    studentName: 'Priya Khatri',
    minutesPracticedThisWeek: 150,
    minutesGoal: 180,
    streakLength: 8
  }
];

export const mockPracticeGoal: PracticeGoal = {
  weeklyMinutesGoal: 210,
  minutesPracticed: 120,
  remainingMinutes: 90
};

export const mockStreak: PracticeStreak = {
  current: 21,
  longest: 45,
  badges: [
    { id: 'weekly-warrior', label: 'Weekly Warrior', earnedAt: formatISO(addDays(today, -14)) },
    { id: 'metronome-master', label: 'Metronome Master', earnedAt: formatISO(addDays(today, -30)) }
  ]
};

export const mockStudentAssignments: StudentAssignment[] = [
  {
    id: 'student-assignment-1',
    title: 'Scale Challenge',
    description: 'Record C, G, D, and A major scales with metronome.',
    dueDate: formatISO(addDays(today, 2)),
    status: 'pending'
  },
  {
    id: 'student-assignment-2',
    title: 'Etude Reflection',
    description: 'Write a short reflection on Kreutzer Etude No. 2 practice.',
    dueDate: formatISO(addDays(today, -1)),
    status: 'graded',
    grade: 96,
    feedback: 'Excellent detail about your bow distribution strategy.'
  }
];

export const mockStudentSchedule: StudentScheduleItem[] = [
  {
    id: 'schedule-1',
    title: 'Lesson with Jamie',
    start: formatISO(addHours(today, 2)),
    end: formatISO(addHours(today, 3)),
    type: 'lesson',
    educatorName: 'Jamie Rivera'
  },
  {
    id: 'schedule-2',
    title: 'Practice: Tone Study',
    start: formatISO(addHours(today, 5)),
    end: formatISO(addHours(today, 6)),
    type: 'practice'
  }
];

export const mockChildren: ChildSummary[] = [
  {
    id: 'child-1',
    name: 'Alex Morgan',
    level: 'Intermediate Piano',
    nextLesson: formatISO(addDays(today, 1)),
    weeklyProgressMinutes: 190,
    weeklyGoalMinutes: 200
  },
  {
    id: 'child-2',
    name: 'Priya Khatri',
    level: 'Advanced Violin',
    nextLesson: formatISO(addDays(today, 2)),
    weeklyProgressMinutes: 160,
    weeklyGoalMinutes: 180
  }
];

export const mockBookingRequests: BookingRequest[] = [
  {
    id: 'booking-1',
    studentName: 'Alex Morgan',
    requestedAt: formatISO(addDays(today, -2)),
    requestedSlot: {
      start: formatISO(addHours(addDays(today, 4), 15)),
      end: formatISO(addHours(addDays(today, 4), 16))
    },
    status: 'pending'
  },
  {
    id: 'booking-2',
    studentName: 'Priya Khatri',
    requestedAt: formatISO(addDays(today, -1)),
    requestedSlot: {
      start: formatISO(addHours(addDays(today, 5), 17)),
      end: formatISO(addHours(addDays(today, 5), 18))
    },
    status: 'approved'
  }
];

export const mockInvoices: Invoice[] = [
  {
    id: 'invoice-1',
    amount: 180,
    issuedAt: formatISO(addDays(today, -10)),
    dueAt: formatISO(addDays(today, -2)),
    status: 'overdue',
    downloadUrl: 'https://example.com/invoices/invoice-1.pdf'
  },
  {
    id: 'invoice-2',
    amount: 220,
    issuedAt: formatISO(addDays(today, -40)),
    dueAt: formatISO(addDays(today, -12)),
    status: 'paid',
    downloadUrl: 'https://example.com/invoices/invoice-2.pdf'
  }
];

