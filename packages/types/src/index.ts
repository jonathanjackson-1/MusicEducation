export type LessonLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LessonSummary {
  id: string;
  title: string;
  level: LessonLevel;
  durationMinutes: number;
}

export interface PracticeStreak {
  userId: string;
  current: number;
  longest: number;
  updatedAt: string;
}
