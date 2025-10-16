export type LessonLevel = 'beginner' | 'intermediate' | 'advanced';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  joinedAt: string;
  timezone?: string | null;
  preferredInstrument?: string | null;
}

export interface LessonSummary {
  id: string;
  title: string;
  level: LessonLevel;
  durationMinutes: number;
  thumbnailUrl?: string | null;
}

export interface LessonResource {
  id: string;
  lessonId: string;
  type: 'video' | 'audio' | 'sheet-music' | 'pdf' | 'link';
  title: string;
  url: string;
  durationSeconds?: number;
  description?: string;
}

export interface Lesson extends LessonSummary {
  description: string;
  instructorId: string;
  tags?: string[];
  publishedAt?: string;
  updatedAt?: string;
  resources?: LessonResource[];
  objectives?: string[];
}

export type AssignmentStatus = 'pending' | 'submitted' | 'completed';

export interface Assignment {
  id: string;
  lessonId: string;
  title: string;
  instructions: string;
  dueDate?: string;
  availableAt: string;
  submittedAt?: string;
  status?: AssignmentStatus;
  attachments?: LessonResource[];
}

export type PracticeMood = 'confident' | 'neutral' | 'challenged';

export interface PracticeLog {
  id: string;
  userId: string;
  lessonId?: string;
  assignmentId?: string;
  startedAt: string;
  durationMinutes: number;
  notes?: string;
  mood?: PracticeMood;
  tempoBpm?: number;
  focusAreas?: string[];
}

export interface PracticeStreak {
  userId: string;
  current: number;
  longest: number;
  updatedAt: string;
  startedAt?: string;
}

export type PolicyType = 'terms' | 'privacy' | 'community' | 'safety';

export interface Policy {
  id: string;
  type: PolicyType;
  title: string;
  body: string;
  version: string;
  publishedAt: string;
  updatedAt?: string;
}

export type BillingInterval = 'monthly' | 'quarterly' | 'yearly' | 'lifetime';

export interface Plan {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  interval: BillingInterval;
  features: string[];
  mostPopular?: boolean;
  trialDays?: number;
}

export interface ApiPaginationMeta {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiMeta {
  requestId?: string;
  servedAt: string;
  locale?: string;
  pagination?: ApiPaginationMeta;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  field?: string;
  helpUrl?: string;
}

export interface ApiResponse<TData> {
  data: TData;
  meta?: ApiMeta;
  errors?: ApiErrorDetail[];
}

export interface PaginatedResponse<TItem> extends ApiResponse<TItem[]> {
  meta: ApiMeta & { pagination: ApiPaginationMeta };
}

export type UserResponse = ApiResponse<User>;
export type UsersResponse = PaginatedResponse<User>;

export type LessonResponse = ApiResponse<Lesson>;
export type LessonsResponse = PaginatedResponse<Lesson>;
export type LessonSummariesResponse = PaginatedResponse<LessonSummary>;

export type AssignmentResponse = ApiResponse<Assignment>;
export type AssignmentsResponse = PaginatedResponse<Assignment>;

export type PracticeLogResponse = ApiResponse<PracticeLog>;
export type PracticeLogsResponse = PaginatedResponse<PracticeLog>;

export type PolicyResponse = ApiResponse<Policy>;
export type PoliciesResponse = PaginatedResponse<Policy>;

export type PlanResponse = ApiResponse<Plan>;
export type PlansResponse = ApiResponse<Plan[]>;
