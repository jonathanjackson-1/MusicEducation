import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CalendarQueryDto } from './dto/calendar-query.dto';

@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalendarController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR, UserRole.STUDENT, UserRole.PARENT)
  getCalendar(@CurrentUser() user: AuthUser, @Query() query: CalendarQueryDto) {
    return this.schedulingService.getCalendar(user.studioId, {
      ...query,
      studioId: query.studioId ?? user.studioId,
    });
  }
}
