import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { UpsertAvailabilityDto } from './dto/upsert-availability.dto';

@Controller('availability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AvailabilityController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  list(@CurrentUser() user: AuthUser) {
    const educatorId = user.role === UserRole.ADMIN ? undefined : user.id;
    return this.schedulingService.listAvailability(user.studioId, educatorId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  upsertAvailability(@CurrentUser() user: AuthUser, @Body() dto: UpsertAvailabilityDto) {
    const fallbackEducatorId =
      user.role === UserRole.ADMIN ? dto.blocks[0]?.educatorId ?? user.id : user.id;
    return this.schedulingService.upsertAvailability(user.studioId, fallbackEducatorId, dto);
  }
}
