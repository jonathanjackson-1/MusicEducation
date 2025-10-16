import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

describe('Protected routes', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: { findMany: jest.fn() },
        studioMember: { upsert: jest.fn() },
        studioInvite: { findUnique: jest.fn() },
        auditLog: { create: jest.fn() },
        $transaction: async (cb: any) => cb({}),
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('denies access to users list without authentication', () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('x-tenant', 'test-studio')
      .expect(401);
  });
});
