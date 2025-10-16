# Music Education SaaS Platform Architecture

## Architecture at a Glance
- Multi-tenant, role-based SaaS serving studios, educators, students, parents/guardians, and administrators.
- Modular monolith using a hexagonal architecture with bounded contexts for Scheduling, Coursework, Practice, Communications, Billing, and Authentication. Prepare for future service extraction.
- Event-driven backbone using outbox pattern and queues. Core events include `LessonScheduled`, `AssignmentCreated`, `PracticeLogged`, and `PaymentFailed`, which feed notifications, analytics, and synchronization jobs.
- Privacy-first design with tenant isolation, row-level security, and consent flows for minors.

## Domain Model Overview
### Core Entities
- Studio (tenant)
- User (roles: Educator, Student, Parent/Guardian, Administrator)
- Instrument, Room
- Lesson (single or recurring), AvailabilityBlock, BookingRequest, WaitlistEntry
- Assignment, AssignmentTemplate, Submission, Rubric, Grade
- PracticeLog, PracticeGoal, Piece (repertoire), Annotation, Recording
- CalendarConnection (Google/Outlook), VideoSession (Zoom/Teams/WebRTC)
- Notification, Consent (COPPA/GDPR), AuditLog
- Plan, Subscription, Invoice, PaymentMethod, Coupon

### Key Relationships
- Studio has many Users.
- Educator has many Lessons.
- Student has many PracticeLogs.
- AssignmentTemplate has many Assignments; Assignment has many Submissions.
- Lesson has one VideoSession.
- User has many CalendarConnections.
- Studio has many Subscriptions and Invoices.

## API Surface (REST or GraphQL)
### Authentication and RBAC
- JWT/OAuth2 with SSO (Google, Apple) and two-factor authentication for Educators/Admins.
- Roles plus fine-grained permissions via policy rules (CASL/OPA-style) with sample matrix:
  - **Educator**: CRUD Lessons (within studio), manage Assignments, view student practice, grade.
  - **Student**: Read assigned items, create submissions and practice logs, request bookings/reschedules.
  - **Parent**: View child schedules/assignments, create booking requests, pay invoices.
  - **Admin**: Manage studio-wide configuration, billing, audit.

### Scheduling
- `POST /availability`
- `POST /bookings`
- `POST /lessons/:id/reschedule`
- `POST /lessons/:id/cancel`
- `GET /calendar`
- `POST /sync/google`
- `POST /sync/outlook`

### Coursework
- `POST /assignment-templates`
- `POST /assignments`
- `PATCH /assignments/:id`
- `POST /submissions`
- `POST /grades`
- `GET /library`

### Practice
- `POST /practice/logs`
- `POST /practice/goals`
- `GET /analytics/practice`

### Notifications
- `POST /notifications/test`
- `POST /notifications/subscribe`
- Background scheduler (BullMQ/Celery/Cloud Tasks) for reminders and nudges.

### Billing (v1 add-on)
- `POST /plans`
- `POST /subscriptions`
- `POST /invoices/:id/pay`
- Webhooks: `invoice.payment_failed`, `customer.subscription.updated`

### Audit and Compliance
- `GET /audit`
- `POST /consents`
- `GET /consents/:studentId`

## Scheduling and Policy Details
- Recurrence using iCal RRULE with canonical series and exception tracking.
- Booking rules configurable per studio: lead time, max lessons/week, buffers, auto-confirm vs manual review.
- Reschedule workflow: educator proposes alternatives, student/parent accepts, regenerating calendar/video links and notifications.
- Cancellation policies managed by rule engine (JSON DSL) covering scenarios like last-minute fees, illness exceptions, and credit banking.
- Waitlists prioritize by submission time and lesson type with auto-offer expirations.
- Integrations:
  - Calendar: two-way sync with incremental tokens and reconciliation.
  - Video: Just-in-time room creation with WebRTC fallback.

## Assignment and Feedback Experience
- Templates include structured sections (warm-ups, technique, repertoire, theory) with placeholders and multi-file attachments.
- Submissions support audio uploads, PDF markup, time-stamped comments, and optional future pitch/tempo analysis.
- Rubrics support weighted criteria, pass/fail or graded scales, and quick-mark comments.
- Curriculum library tagged by instrument, level, exam syllabus with reusable deltas.
- Smart suggestions nudge based on performance trends (e.g., low practice time for a piece).

## Practice and Motivation
- Timer with categories and offline resume.
- Goals for weekly time and per-piece targets with streaks/badges accommodating pauses.
- Analytics for students (time vs assignments, piece focus, streaks) and educators (cohort heatmaps, attendance, on-time submissions).
- Future insights pipeline for ML-driven suggestions.

## Tech Stack
- **Backend**: Node + NestJS or Python + FastAPI, PostgreSQL with Prisma/SQLAlchemy, Redis for sessions/queues, S3/GCS for object storage, FFmpeg workers for audio.
- **Frontend**: Next.js with shadcn/ui; React Native mobile app with shared TypeScript package.
- **Offline**: IndexedDB/Expo SQLite with conflict resolution and audit trail.
- **Shared**: OAuth/email/Apple/Google auth, tenant-aware JWTs, notification orchestration (Postmark/SES, FCM/APNs, Twilio), feature flags, per-studio policy registry.

## Security, Privacy, and Compliance
- Data minimization, PII tagging, encryption at rest (KMS) and in transit (TLS).
- Row-level security by studio and role enforced in queries.
- Parental consent flows, age gates, data export/delete workflows.
- Audit logging for grades, attendance, cancellations, payouts.
- Backups with PITR (RTO ≤ 4h, RPO ≤ 15m).
- Secrets via cloud KMS and short-lived credentials.
- DDoS/abuse protections: rate limiting, email verification, file validation, antivirus scanning.

## Observability and Quality
- Structured logging with request/tenant IDs.
- Metrics: p95 latency, queue lag, job failure rate, notification deliverability, sync drift.
- Tracing with OpenTelemetry.
- Testing pyramid: unit (policy engine, recurrence), integration (DB/queues/mocks), E2E (Playwright) covering key flows, accessibility checks (axe), i18n snapshots.
- CI/CD: linting, type checking, tests, preview deployments, migration guard.

## Monetization
- Plan tiers: Solo Teacher, Small Studio, School with seat/storage/feature limits.
- Add-ons: SMS bundles, extra storage, exam/report exports.
- Billing via Stripe with tax, invoices, trials, coupons, metered SMS.
- Education pricing and annual discounts.

## Accessibility and Internationalization
- Target WCAG 2.2 AA with full keyboard navigation and future audio captioning.
- Timezone/locale awareness, RTL readiness, global notation support.

## Risks and Mitigations
1. Calendar sync drift → incremental tokens, reconciliation jobs, user diff view.
2. Video provider outages → multi-provider strategy with WebRTC fallback.
3. Handling minors' data → strict consent flows, redaction, export/delete workflows.
4. Audio upload bloat → limits, automatic transcoding, lifecycle policies.
5. Adoption friction → importers, seed templates, future integrations.

## Roadmap
### MVP (6–8 weeks)
- Auth/RBAC/Studio setup.
- Availability and booking within studio rules (no external sync).
- Assignment templates through submissions and feedback.
- Practice timer/logs with basic goals.
- Email and push notifications.
- Core dashboards for Educator and Student.

### v0.2 Enhancements
- Rescheduling/cancellation policies with waitlists.
- Basic analytics (time vs assigned, educator cohort heatmap).
- File annotations and audio waveform comments.

### v1
- Two-way calendar sync, Zoom/Teams integration.
- Billing/subscriptions and storage quotas.
- Streaks/badges and nudge engine.
- Reports (attendance, completion, practice summaries).

### v1.1+
- Ensemble management, repertoire library, exam prep trackers.
- Parent portal upgrades.
- ML insights and teacher assistant tips.

## Acceptance Criteria Examples
- **Booking**: Successful booking writes lesson, video link, notifications, and calendar event when sync enabled.
- **Reschedule**: Proposals with ≥2 alternatives update series exceptions and audit logs.
- **Submission**: Audio uploads ≤10 minutes transcode within 2 minutes with waveform and time-stamped notes.
- **Practice**: Offline 30-minute session syncs without duplication and updates goals immediately.
- **Privacy**: Parent can export child data in one click; deletion requests queue and complete within SLA.
