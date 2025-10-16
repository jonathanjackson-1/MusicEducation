import { ForbiddenException, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { TenantContextService } from './tenant-context.service';

const TENANT_SCOPED_MODELS = [
  'User',
  'Instrument',
  'Room',
  'AvailabilityBlock',
  'Lesson',
  'LessonOccurrence',
  'LessonException',
  'BookingRequest',
  'WaitlistEntry',
  'AssignmentTemplate',
  'Assignment',
  'Submission',
  'Rubric',
  'Grade',
  'PracticeLog',
  'PracticeGoal',
  'Piece',
  'Annotation',
  'Recording',
  'CalendarConnection',
  'VideoSession',
  'Notification',
  'NotificationPreference',
  'NotificationSubscription',
  'NotificationJob',
  'Consent',
  'AuditLog',
  'Subscription',
  'Invoice',
  'PaymentMethod',
  'Coupon',
  'StudioInvite',
  'StudioMember',
  'DataRequest',
];

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly configService: ConfigService,
    private readonly tenantContext: TenantContextService,
  ) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
    });

    this.$use(async (params: any, next: any) => {
      if (params.action === '$executeRaw' || params.action === '$executeRawUnsafe') {
        return next(params);
      }

      const studioId = this.tenantContext.getStudioId();
      if (!studioId) {
        return next(params);
      }

      await super.$executeRaw`select set_config('app.current_studio', ${studioId}, true)`;

      try {
        return await next(params);
      } finally {
        await super.$executeRaw`select set_config('app.current_studio', '', true)`;
      }
    });

    this.$use(async (params: any, next: any) => {
      if (!params.model || !TENANT_SCOPED_MODELS.includes(params.model)) {
        return next(params);
      }

      const studioId = this.tenantContext.getStudioId();
      if (!studioId) {
        throw new ForbiddenException('Studio context is required for tenant-scoped models');
      }

      await this.applyTenantFilter(params, studioId);
      return next(params);
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async applyTenantFilter(params: any, studioId: string) {
    const action = params.action;
    params.args = params.args ?? {};

    if (action === 'create') {
      params.args.data = {
        ...params.args.data,
        studioId,
      };
      return;
    }

    if (action === 'createMany') {
      params.args.data = params.args.data.map((data: Record<string, unknown>) => ({
        ...data,
        studioId,
      }));
      return;
    }

    if (['findUnique', 'findUniqueOrThrow'].includes(action)) {
      params.action = action === 'findUniqueOrThrow' ? 'findFirstOrThrow' : 'findFirst';
      params.args.where = this.withStudioWhere(params.args.where, studioId);
      return;
    }

    if (['updateMany', 'deleteMany'].includes(action)) {
      params.args.where = this.withStudioWhere(params.args.where, studioId);
      return;
    }

    if (['update', 'delete'].includes(action)) {
      await this.ensureTenantOwnership(params.model, params.args.where, studioId);
      return;
    }

    if (action === 'upsert') {
      await this.ensureTenantOwnership(params.model, params.args.where, studioId);
      params.args.create = {
        ...params.args.create,
        studioId,
      };
      params.args.update = {
        ...params.args.update,
        studioId,
      };
      return;
    }

    params.args.where = this.withStudioWhere(params.args.where, studioId);
  }

  private withStudioWhere(where: Record<string, unknown> | undefined, studioId: string) {
    if (!where) {
      return { studioId };
    }

    return {
      AND: [where, { studioId }],
    };
  }

  private async ensureTenantOwnership(model: string, where: Record<string, unknown>, studioId: string) {
    if (!where) {
      throw new ForbiddenException('Tenant scoped queries require filters');
    }

    const delegate = (this as any)[this.getDelegateName(model)];
    if (!delegate?.findUnique) {
      return;
    }
    const entity = await delegate.findUnique({ where });
    if (!entity || entity.studioId !== studioId) {
      throw new ForbiddenException('Resource not found in tenant scope');
    }
  }

  private getDelegateName(model: string) {
    return model.charAt(0).toLowerCase() + model.slice(1);
  }
}
