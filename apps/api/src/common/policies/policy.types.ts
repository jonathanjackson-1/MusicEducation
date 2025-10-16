import { AuthUser } from '../interfaces/auth-user.interface';
import { PolicyAction } from './policy.service';

export interface PolicyContext<T = any> {
  user: AuthUser;
  resource?: T;
  params?: Record<string, any>;
}

export interface PolicyDescriptor {
  action: PolicyAction;
  subject: string;
  ownerParam?: string;
  ownerField?: string;
  idParam?: string;
}

export type PolicyHandler =
  | PolicyDescriptor
  | ((context: PolicyContext) => boolean | Promise<boolean>);
