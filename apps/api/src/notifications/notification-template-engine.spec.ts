import { NotificationTemplateEngine } from './template-engine/notification-template-engine.service';
import { NotificationTemplateType } from './types/notification-template.enum';

describe('NotificationTemplateEngine', () => {
  const engine = new NotificationTemplateEngine();
  const baseContext = {
    recipientName: 'Avery Student',
    studioName: 'Sound Studio',
    educatorName: 'Logan Teacher',
    lessonDate: 'April 22, 2024',
    lessonTime: '3:30 PM',
    bookingUrl: 'https://studio.example.com/lessons/lesson-123',
    roomName: 'Studio A',
    proposalDate: 'April 24, 2024',
    proposalTime: '5:00 PM',
    proposalUrl: 'https://studio.example.com/lessons/proposal',
    rescheduleUrl: 'https://studio.example.com/lessons/reschedule',
    cancellationReason: 'Educator is unwell',
    assignmentTitle: 'Chromatic Scales',
    assignmentSummary: 'Warm up at 60 bpm, increase to 80 bpm.',
    assignmentUrl: 'https://studio.example.com/assignments/assignment-45',
    dueDate: 'April 26, 2024',
    submissionUrl: 'https://studio.example.com/submissions/submission-9',
    feedback: 'Great tone and articulation—keep it up!',
    score: 'A',
    totalMinutes: 210,
    streakLength: 12,
    highlights: ['Logged 6 sessions', 'Met tempo goal twice'],
  };

  const contexts: Record<NotificationTemplateType, Record<string, unknown>> = {
    [NotificationTemplateType.BOOKING_CONFIRMATION]: {
      ...baseContext,
      reminder: true,
      reminderWindow: '24 hours',
      pushData: { origin: 'booking' },
    },
    [NotificationTemplateType.BOOKING_RESCHEDULE_PROPOSAL]: {
      ...baseContext,
      pushData: { origin: 'reschedule' },
    },
    [NotificationTemplateType.BOOKING_CANCELLATION]: {
      ...baseContext,
      pushData: { origin: 'cancellation' },
    },
    [NotificationTemplateType.ASSIGNMENT_CREATED]: {
      ...baseContext,
      pushData: { origin: 'assignment' },
    },
    [NotificationTemplateType.SUBMISSION_FEEDBACK]: {
      ...baseContext,
      pushData: { origin: 'feedback' },
    },
    [NotificationTemplateType.PRACTICE_STREAK]: {
      ...baseContext,
      pushData: { origin: 'practice' },
    },
  };

  it('renders every template variant', () => {
    const results = Object.values(NotificationTemplateType).map((template) => ({
      template,
      email: engine.renderEmail(template, 'en', contexts[template]),
      sms: engine.renderSms(template, 'en', contexts[template]),
      push: engine.renderPush(template, 'en', contexts[template]),
    }));

    expect(results).toMatchSnapshot();
  });
});
