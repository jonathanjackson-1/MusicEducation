import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@Controller('scheduling/availability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AvailabilityController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAvailabilityDto) {
    return this.schedulingService.createAvailability(user.studioId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  list() {
    return this.schedulingService.listAvailability();
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  update(@Param('id') id: string, @Body() dto: UpdateAvailabilityDto) {
    return this.schedulingService.updateAvailability(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  remove(@Param('id') id: string) {
    return this.schedulingService.removeAvailability(id);
  }
}
