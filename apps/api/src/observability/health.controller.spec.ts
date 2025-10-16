import { Test } from '@nestjs/testing';
import { TerminusModule } from '@nestjs/terminus';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes a health endpoint', async () => {
    const response = await request(app.getHttpServer()).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('exposes a readiness endpoint', async () => {
    const response = await request(app.getHttpServer()).get('/ready');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
