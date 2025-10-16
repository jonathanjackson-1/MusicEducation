import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('plans')
  @Roles(UserRole.ADMIN)
  createPlan(@Body() dto: CreatePlanDto) {
    return this.billingService.createPlan(dto);
  }

  @Get('plans')
  listPlans() {
    return this.billingService.listPlans();
  }

  @Post('subscriptions')
  @Roles(UserRole.ADMIN)
  createSubscription(@CurrentUser() user: AuthUser, @Body() dto: CreateSubscriptionDto) {
    return this.billingService.createSubscription(user, dto);
  }

  @Patch('subscriptions/:id')
  @Roles(UserRole.ADMIN)
  updateSubscription(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.billingService.updateSubscription(id, dto);
  }

  @Get('invoices')
  @Roles(UserRole.ADMIN)
  listInvoices(@CurrentUser() user: AuthUser) {
    return this.billingService.listInvoices(user.studioId);
  }
}
