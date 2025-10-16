import { Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { LessonsController } from './lessons.controller';
import { AvailabilityController } from './availability.controller';
import { BookingsController } from './bookings.controller';
import { CalendarController } from './calendar.controller';
import { CommonModule } from '../common/common.module';
import { SchedulingQueueService } from './scheduling-queue.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [CommonModule, AuditModule],
  controllers: [LessonsController, AvailabilityController, BookingsController, CalendarController],
  providers: [SchedulingService, SchedulingQueueService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
