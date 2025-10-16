import type { LucideIcon } from 'lucide-react';
import {
  CalendarIcon,
  CheckSquareIcon,
  FileTextIcon,
  GaugeIcon,
  NotebookTabsIcon,
  Settings2Icon,
  SparklesIcon,
  TimerIcon,
  Users2Icon
} from 'lucide-react';

import type { UserRole } from '@/lib/api/client';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  translationKey?: string;
}

export const navigation: Record<UserRole, NavItem[]> = {
  educator: [
    {
      label: 'Calendar',
      href: '/educator/calendar',
      icon: CalendarIcon,
      description: 'Plan lessons and manage studio availability.',
      translationKey: 'nav.educator.calendar'
    },
    {
      label: 'Assignments',
      href: '/educator/assignments',
      icon: NotebookTabsIcon,
      description: 'Create, assign, and grade repertoire and exercises.',
      translationKey: 'nav.educator.assignments'
    },
    {
      label: 'Students',
      href: '/educator/students',
      icon: Users2Icon,
      description: 'Monitor practice analytics and engagement.',
      translationKey: 'nav.educator.students'
    },
    {
      label: 'Settings',
      href: '/educator/settings',
      icon: Settings2Icon,
      description: 'Policies, notifications, and studio preferences.',
      translationKey: 'nav.educator.settings'
    }
  ],
  student: [
    {
      label: 'My Schedule',
      href: '/student/my-schedule',
      icon: CalendarIcon,
      description: 'Your lessons and practice blocks at a glance.',
      translationKey: 'nav.student.schedule'
    },
    {
      label: 'My Assignments',
      href: '/student/my-assignments',
      icon: CheckSquareIcon,
      description: 'Submit recordings, scores, and reflections.',
      translationKey: 'nav.student.assignments'
    },
    {
      label: 'Practice',
      href: '/student/practice',
      icon: TimerIcon,
      description: 'Track time, log notes, and hit your weekly goal.',
      translationKey: 'nav.student.practice'
    },
    {
      label: 'Streaks & Badges',
      href: '/student/streaks',
      icon: SparklesIcon,
      description: 'Celebrate consistency and unlock achievements.',
      translationKey: 'nav.student.streaks'
    }
  ],
  parent: [
    {
      label: 'Children',
      href: '/parent/children',
      icon: Users2Icon,
      description: 'Progress snapshots, goals, and attendance.',
      translationKey: 'nav.parent.children'
    },
    {
      label: 'Booking Requests',
      href: '/parent/booking-requests',
      icon: CalendarIcon,
      description: 'Request new lessons or reschedule existing ones.',
      translationKey: 'nav.parent.bookings'
    },
    {
      label: 'Invoices',
      href: '/parent/invoices',
      icon: FileTextIcon,
      description: 'Review billing history and download statements.',
      translationKey: 'nav.parent.invoices'
    }
  ]
};

export const quickActions: Record<UserRole, NavItem[]> = {
  educator: [
    { label: 'New Availability', href: '/educator/calendar', icon: GaugeIcon },
    { label: 'Template Library', href: '/educator/assignments', icon: NotebookTabsIcon }
  ],
  student: [
    { label: 'Start Practice Timer', href: '/student/practice', icon: TimerIcon },
    { label: 'Review Feedback', href: '/student/my-assignments', icon: CheckSquareIcon }
  ],
  parent: [
    { label: 'Book a Lesson', href: '/parent/booking-requests', icon: CalendarIcon },
    { label: 'Download Latest Invoice', href: '/parent/invoices', icon: FileTextIcon }
  ]
};

