import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataRequest } from '@prisma/client';

@Injectable()
export class PrivacyQueueService {
  private readonly logger = new Logger(PrivacyQueueService.name);

  constructor(private readonly events: EventEmitter2) {}

  async enqueueDataRequest(request: DataRequest) {
    this.logger.debug(`Queueing data request ${request.id} for processing`);
    this.events.emit('privacy.data-request.queued', {
      requestId: request.id,
      studioId: request.studioId,
      type: request.type,
    });
  }
}
