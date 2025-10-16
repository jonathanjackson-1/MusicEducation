import fs from 'node:fs';
import path from 'node:path';
import { Pact } from '@pact-foundation/pact';
import axios from 'axios';

describe('Mobile app ↔ API contract', () => {
  const provider = new Pact({
    consumer: 'Soundstudio Mobile',
    provider: 'Soundstudio API',
    dir: path.resolve(__dirname, '../pacts'),
    log: path.resolve(__dirname, '../logs', 'mobile-consumer.log'),
  });

  beforeAll(async () => {
    fs.mkdirSync(path.resolve(__dirname, '../pacts'), { recursive: true });
    fs.mkdirSync(path.resolve(__dirname, '../logs'), { recursive: true });
    await provider.setup();
  });
  afterAll(() => provider.finalize());
  afterEach(() => provider.verify());

  it('supports syncing offline practice streaks', async () => {
    await provider.addInteraction({
      state: 'student has offline practice streak data to sync',
      uponReceiving: 'a sync payload containing offline practice logs',
      withRequest: {
        method: 'POST',
        path: '/practice/sync',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          studentId: 'student-123',
          offlineEntries: [
            {
              startedAt: '2024-03-01T15:00:00.000Z',
              durationSeconds: 900,
            },
          ],
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: {
          streak: {
            current: 5,
            longest: 12,
          },
        },
      },
    });

    await provider.executeTest(async (mockServer) => {
      const response = await axios.post(`${mockServer.url}/practice/sync`, {
        studentId: 'student-123',
        offlineEntries: [
          {
            startedAt: '2024-03-01T15:00:00.000Z',
            durationSeconds: 900,
          },
        ],
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        streak: {
          current: 5,
          longest: 12,
        },
      });
    });
  });
});
