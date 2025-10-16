import { Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { LessonsController } from './lessons.controller';
import { AvailabilityController } from './availability.controller';
import { BookingRequestsController } from './booking-requests.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [LessonsController, AvailabilityController, BookingRequestsController],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
