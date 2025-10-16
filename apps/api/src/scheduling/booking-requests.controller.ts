import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { CreateBookingRequestDto } from './dto/create-booking-request.dto';
import { UpdateBookingRequestDto } from './dto/update-booking-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { PoliciesGuard } from '../common/guards/policies.guard';
import { Policies } from '../common/decorators/policies.decorator';
import { PolicyAction } from '../common/policies/policy.service';

@Controller('scheduling/booking-requests')
@UseGuards(JwtAuthGuard, RolesGuard, PoliciesGuard)
export class BookingRequestsController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post()
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingRequestDto) {
    return this.schedulingService.createBookingRequest(user.studioId, {
      ...dto,
      studentId: user.id,
    });
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  list() {
    return this.schedulingService.listBookingRequests();
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  @Policies({ action: PolicyAction.Update, subject: 'BookingRequest', ownerField: 'studentId' })
  update(@Param('id') id: string, @Body() dto: UpdateBookingRequestDto) {
    return this.schedulingService.updateBookingRequest(id, dto);
  }
}
