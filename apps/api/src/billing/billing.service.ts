import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  createPlan(dto: CreatePlanDto) {
    return this.prisma.plan.create({
      data: {
        ...dto,
        features: dto.features ? JSON.parse(dto.features) : undefined,
      },
    });
  }

  listPlans() {
    return this.prisma.plan.findMany();
  }

  async createSubscription(user: AuthUser, dto: CreateSubscriptionDto) {
    const subscription = await this.prisma.subscription.create({
      data: {
        planId: dto.planId,
        studioId: user.studioId,
      },
    });
    await this.audit.record({
      studioId: user.studioId,
      actorId: user.id,
      entity: 'subscription',
      entityId: subscription.id,
      action: 'billing.subscription.created',
      delta: { planId: dto.planId },
    });
    return subscription;
  }

  async updateSubscription(id: string, user: AuthUser, dto: UpdateSubscriptionDto) {
    const existing = await this.prisma.subscription.findUnique({ where: { id } });
    const updated = await this.prisma.subscription.update({ where: { id }, data: dto });
    if (existing) {
      const delta = Object.fromEntries(
        Object.entries(dto).map(([key, value]) => [
          key,
          {
            previous: (existing as Record<string, unknown>)[key],
            current: value ?? (updated as Record<string, unknown>)[key],
          },
        ]),
      );

      await this.audit.record({
        studioId: existing.studioId,
        actorId: user.id,
        entity: 'subscription',
        entityId: updated.id,
        action: 'billing.subscription.updated',
        delta,
      });
    }
    return updated;
  }

  listInvoices(studioId: string) {
    return this.prisma.invoice.findMany({ where: { studioId } });
  }
}
