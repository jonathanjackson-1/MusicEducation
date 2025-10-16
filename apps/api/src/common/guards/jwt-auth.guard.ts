import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantContextService } from '../../prisma/tenant-context.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly tenantContext: TenantContextService) {
    super();
  }

  handleRequest(err: unknown, user: any, info: unknown, context: ExecutionContext, status?: unknown) {
    const request = context.switchToHttp().getRequest();
    if (user) {
      this.tenantContext.enter({
        studioId: user.studioId,
        userId: user.id,
      });
      request.user = user;
    }
    return super.handleRequest(err, user, info, context, status);
  }
}
