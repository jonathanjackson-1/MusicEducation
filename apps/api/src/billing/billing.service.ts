import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

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

  createSubscription(user: AuthUser, dto: CreateSubscriptionDto) {
    return this.prisma.subscription.create({
      data: {
        planId: dto.planId,
        studioId: user.studioId,
      },
    });
  }

  updateSubscription(id: string, dto: UpdateSubscriptionDto) {
    return this.prisma.subscription.update({ where: { id }, data: dto });
  }

  listInvoices(studioId: string) {
    return this.prisma.invoice.findMany({ where: { studioId } });
  }
}
