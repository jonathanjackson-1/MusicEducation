import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  studioId: string | null;
  userId?: string | null;
}

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantContext>();

  run(context: TenantContext, callback: () => void) {
    this.storage.run(context, callback);
  }

  enter(context: TenantContext) {
    this.storage.enterWith(context);
  }

  getStudioId(): string | null {
    return this.storage.getStore()?.studioId ?? null;
  }

  getUserId(): string | null {
    return this.storage.getStore()?.userId ?? null;
  }
}
