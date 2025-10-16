import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  list(studioId: string) {
    return this.prisma.auditLog.findMany({
      where: { studioId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
