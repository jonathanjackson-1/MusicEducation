import { Module } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { ConsentController } from './consent.controller';
import { CommonModule } from '../common/common.module';
import { PrivacyQueueService } from './privacy-queue.service';

@Module({
  imports: [CommonModule],
  controllers: [ConsentController],
  providers: [ConsentService, PrivacyQueueService],
  exports: [ConsentService],
})
export class ConsentModule {}
