import fs from 'node:fs';
import path from 'node:path';
import { Pact } from '@pact-foundation/pact';
import axios from 'axios';

describe('Web app ↔ API contract', () => {
  const provider = new Pact({
    consumer: 'Soundstudio Web',
    provider: 'Soundstudio API',
    dir: path.resolve(__dirname, '../pacts'),
    log: path.resolve(__dirname, '../logs', 'web-consumer.log'),
  });

  beforeAll(async () => {
    fs.mkdirSync(path.resolve(__dirname, '../pacts'), { recursive: true });
    fs.mkdirSync(path.resolve(__dirname, '../logs'), { recursive: true });
    await provider.setup();
  });
  afterAll(() => provider.finalize());
  afterEach(() => provider.verify());

  it('allows a student to book a lesson within policy', async () => {
    await provider.addInteraction({
      state: 'student is eligible to book a lesson',
      uponReceiving: 'a booking request within policy limits',
      withRequest: {
        method: 'POST',
        path: '/lessons',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          studentId: 'student-123',
          educatorId: 'educator-456',
          startTime: '2024-03-01T16:00:00.000Z',
          durationMinutes: 30,
        },
      },
      willRespondWith: {
        status: 201,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: {
          id: 'lesson-789',
          status: 'scheduled',
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      const response = await axios.post(`${mockServer.url}/lessons`, {
        studentId: 'student-123',
        educatorId: 'educator-456',
        startTime: '2024-03-01T16:00:00.000Z',
        durationMinutes: 30,
      });

      expect(response.status).toBe(201);
      expect(response.data).toEqual({ id: 'lesson-789', status: 'scheduled' });
    });
  });
});
