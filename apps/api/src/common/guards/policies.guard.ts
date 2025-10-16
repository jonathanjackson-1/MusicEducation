import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { POLICIES_KEY } from '../decorators/policies.decorator';
import { PolicyHandler } from '../policies/policy.types';
import { PolicyService, PolicyAction } from '../policies/policy.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policyService: PolicyService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handlers = this.reflector.getAllAndOverride<PolicyHandler[]>(POLICIES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!handlers || handlers.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resource = request.resource;
    for (const handler of handlers) {
      const result =
        typeof handler === 'function'
          ? await handler({
              user,
              resource,
              params: request.params,
            })
          : await this.evaluateDescriptor(handler, user, request.params);
      if (!result) {
        return false;
      }
    }

    return true;
  }

  private async evaluateDescriptor(
    handler: { action: PolicyAction; subject: string; ownerParam?: string; ownerField?: string; idParam?: string },
    user: any,
    params: Record<string, any>,
  ) {
    const ownerId = handler.ownerParam ? params?.[handler.ownerParam] : undefined;
    if (handler.ownerField) {
      const resource = await this.lookupResource(handler.subject, params?.[handler.idParam ?? 'id']);
      const resourceOwnerId = resource ? resource[handler.ownerField] : undefined;
      return this.policyService.can(user, handler.action, handler.subject, resourceOwnerId);
    }
    return this.policyService.can(user, handler.action, handler.subject, ownerId);
  }

  private lookupResource(subject: string, id?: string) {
    if (!id) {
      return null;
    }

    const delegates: Record<string, (id: string) => Promise<any>> = {
      User: (resourceId: string) => this.prisma.user.findUnique({ where: { id: resourceId } }),
      Assignment: (resourceId: string) => this.prisma.assignment.findUnique({ where: { id: resourceId } }),
      PracticeLog: (resourceId: string) => this.prisma.practiceLog.findUnique({ where: { id: resourceId } }),
      Lesson: (resourceId: string) => this.prisma.lesson.findUnique({ where: { id: resourceId } }),
      BookingRequest: (resourceId: string) => this.prisma.bookingRequest.findUnique({ where: { id: resourceId } }),
    };

    const delegate = delegates[subject];
    return delegate ? delegate(id) : null;
  }
}
