import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(user.studioId, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notificationsService.list(user.id);
  }

  @Patch(':id')
  markRead(@Param('id') id: string, @Body() dto: UpdateNotificationDto) {
    return this.notificationsService.markRead(id, dto);
  }
}
