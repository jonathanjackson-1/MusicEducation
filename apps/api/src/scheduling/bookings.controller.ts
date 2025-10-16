import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post()
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return this.schedulingService.createBooking(user.studioId, user, dto);
  }
}
