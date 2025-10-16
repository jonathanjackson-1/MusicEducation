import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(entry: {
    studioId: string;
    actorId?: string | null;
    entity: string;
    entityId?: string | null;
    action: string;
    delta?: Record<string, unknown> | null;
    context?: Record<string, unknown> | null;
  }) {
    return this.prisma.auditLog.create({
      data: {
        studioId: entry.studioId,
        actorId: entry.actorId ?? undefined,
        entity: entry.entity,
        entityId: entry.entityId ?? undefined,
        action: entry.action,
        delta: entry.delta ?? undefined,
        context: entry.context ?? undefined,
      },
    });
  }

  list(studioId: string) {
    return this.prisma.auditLog.findMany({
      where: { studioId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
