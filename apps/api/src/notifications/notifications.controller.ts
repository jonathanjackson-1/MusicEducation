import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationTestDto } from './dto/notification-test.dto';
import { SubscribeNotificationDto } from './dto/subscribe-notification.dto';
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

  @Post('test')
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  sendTest(@CurrentUser() user: AuthUser, @Body() dto: NotificationTestDto) {
    return this.notificationsService.sendTest(user.studioId, dto);
  }

  @Post('subscribe')
  @Roles(
    UserRole.ADMIN,
    UserRole.EDUCATOR,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  subscribe(@CurrentUser() user: AuthUser, @Body() dto: SubscribeNotificationDto) {
    return this.notificationsService.subscribe(user.studioId, user.id, dto);
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
