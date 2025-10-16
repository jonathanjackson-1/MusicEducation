import { SetMetadata } from '@nestjs/common';
import { PolicyHandler } from '../policies/policy.types';

export const POLICIES_KEY = 'policies';
export const Policies = (...handlers: PolicyHandler[]) => SetMetadata(POLICIES_KEY, handlers);
