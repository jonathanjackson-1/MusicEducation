import { randomUUID } from 'node:crypto';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudiosModule } from './studios/studios.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { CourseworkModule } from './coursework/coursework.module';
import { PracticeModule } from './practice/practice.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StorageModule } from './storage/storage.module';
import { BillingModule } from './billing/billing.module';
import { AuditModule } from './audit/audit.module';
import { ConsentModule } from './consent/consent.module';
import { TenantMiddleware } from './prisma/tenant.middleware';
import { CommonModule } from './common/common.module';
import { ObservabilityModule } from './observability/observability.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId(req, res) {
          const existingId = req.headers['x-request-id'];
          const requestId = Array.isArray(existingId)
            ? existingId[0]
            : existingId;
          if (requestId) {
            res.setHeader('x-request-id', requestId);
            return requestId;
          }

          const generatedId = randomUUID();
          res.setHeader('x-request-id', generatedId);
          return generatedId;
        },
        serializers: {
          req(request) {
            return {
              id: request.id,
              method: request.method,
              url: request.url,
            };
          },
          res(reply) {
            return {
              statusCode: reply.statusCode,
            };
          },
        },
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    CommonModule,
    ObservabilityModule,
    AuthModule,
    UsersModule,
    StudiosModule,
    SchedulingModule,
    CourseworkModule,
    PracticeModule,
    NotificationsModule,
    StorageModule,
    BillingModule,
    AuditModule,
    ConsentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
