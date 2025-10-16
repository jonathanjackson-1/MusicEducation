import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    CommonModule,
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
