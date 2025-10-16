import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { CreateParentalConsentDto } from './dto/create-parental-consent.dto';
import { CreateDataRequestDto } from './dto/create-data-request.dto';
import { PrivacyQueueService } from './privacy-queue.service';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService, private readonly privacyQueue: PrivacyQueueService) {}

  create(user: AuthUser, dto: CreateConsentDto) {
    const now = new Date();
    return this.prisma.consent.upsert({
      where: {
        studioId_subjectId_type: {
          studioId: user.studioId,
          subjectId: dto.subjectId,
          type: dto.type,
        },
      },
      create: {
        studioId: user.studioId,
        subjectId: dto.subjectId,
        type: dto.type,
        grantedAt: now,
        grantedById: user.id,
        metadata: dto.metadata ?? undefined,
      },
      update: {
        grantedAt: dto.granted === false ? undefined : now,
        revokedAt: dto.granted === false ? now : null,
        grantedById: user.id,
        metadata: dto.metadata ?? undefined,
      },
    });
  }

  update(id: string, user: AuthUser, dto: UpdateConsentDto) {
    return this.prisma.consent.update({
      where: { id },
      data: {
        grantedAt: dto.granted ? new Date() : undefined,
        revokedAt: dto.granted === false ? new Date() : null,
        grantedById: user.id,
      },
    });
  }

  list(studioId: string) {
    return this.prisma.consent.findMany({
      where: { studioId },
      include: { subject: true, grantedBy: true },
    });
  }

  recordParentalConsent(user: AuthUser, dto: CreateParentalConsentDto) {
    const now = new Date();
    const type = dto.type ?? 'parental';
    return this.prisma.consent.upsert({
      where: {
        studioId_subjectId_type: {
          studioId: user.studioId,
          subjectId: dto.minorId,
          type,
        },
      },
      create: {
        studioId: user.studioId,
        subjectId: dto.minorId,
        grantedById: dto.guardianId,
        guardianRelationship: dto.relationship,
        grantedAt: now,
        revokedAt: dto.granted === false ? now : null,
        type,
      },
      update: {
        grantedById: dto.guardianId,
        guardianRelationship: dto.relationship,
        grantedAt: dto.granted === false ? undefined : now,
        revokedAt: dto.granted === false ? now : null,
      },
    });
  }

  async createDataRequest(user: AuthUser, dto: CreateDataRequestDto) {
    const request = await this.prisma.dataRequest.create({
      data: {
        studioId: user.studioId,
        subjectId: dto.subjectId,
        requestedById: user.id,
        type: dto.type,
        reason: dto.reason,
        payload: dto.payload,
      },
    });

    await this.privacyQueue.enqueueDataRequest(request);
    return request;
  }

  listDataRequests(studioId: string) {
    return this.prisma.dataRequest.findMany({
      where: { studioId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
