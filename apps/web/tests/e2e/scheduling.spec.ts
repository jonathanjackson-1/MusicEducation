import { test } from '@playwright/test';

test.describe('Scheduling flows', () => {
  test('Student books a lesson within policy', async () => {
    test.skip(true, 'Implement once booking UI is available');
  });

  test('Educator proposes reschedule & student accepts', async () => {
    test.skip(true, 'Implement once rescheduling UI is available');
  });
});
