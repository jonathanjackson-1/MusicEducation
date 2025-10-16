import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { RescheduleLessonDto } from './dto/reschedule-lesson.dto';
import { CancelLessonDto } from './dto/cancel-lesson.dto';

@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonsController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLessonDto) {
    return this.schedulingService.createLesson(user.studioId, dto);
  }

  @Post(':id/reschedule')
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR, UserRole.STUDENT, UserRole.PARENT)
  reschedule(@Param('id') lessonId: string, @CurrentUser() user: AuthUser, @Body() dto: RescheduleLessonDto) {
    return this.schedulingService.rescheduleLesson(lessonId, user, dto);
  }

  @Post(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR, UserRole.STUDENT, UserRole.PARENT)
  cancel(@Param('id') lessonId: string, @CurrentUser() user: AuthUser, @Body() dto: CancelLessonDto) {
    return this.schedulingService.cancelLesson(lessonId, user, dto);
  }
}
