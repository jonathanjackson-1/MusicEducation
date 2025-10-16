import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  create(studioId: string, dto: CreateConsentDto) {
    return this.prisma.consent.upsert({
      where: {
        studioId_userId_type: {
          studioId,
          userId: dto.userId,
          type: dto.type,
        },
      },
      create: {
        studioId,
        userId: dto.userId,
        type: dto.type,
        grantedAt: new Date(),
      },
      update: {
        grantedAt: dto.granted === false ? undefined : new Date(),
        revokedAt: dto.granted === false ? new Date() : null,
      },
    });
  }

  update(id: string, dto: UpdateConsentDto) {
    return this.prisma.consent.update({
      where: { id },
      data: {
        grantedAt: dto.granted ? new Date() : undefined,
        revokedAt: dto.granted === false ? new Date() : null,
      },
    });
  }

  list(studioId: string) {
    return this.prisma.consent.findMany({ where: { studioId } });
  }
}
