import { Module } from '@nestjs/common';
import { RolesGuard } from './guards/roles.guard';
import { PoliciesGuard } from './guards/policies.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PolicyService } from './policies/policy.service';

@Module({
  providers: [RolesGuard, PoliciesGuard, JwtAuthGuard, PolicyService],
  exports: [RolesGuard, PoliciesGuard, JwtAuthGuard, PolicyService],
})
export class CommonModule {}
