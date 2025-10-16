import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from './tenant-context.service';

declare module 'express' {
  interface Request {
    studioId?: string;
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const studioId = (req.headers['x-tenant'] as string | undefined)?.trim();
    if (!studioId) {
      throw new UnauthorizedException('x-tenant header is required');
    }

    req.studioId = studioId;
    this.tenantContext.enter({ studioId });
    next();
  }
}
