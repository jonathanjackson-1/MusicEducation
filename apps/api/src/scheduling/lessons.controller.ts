import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PoliciesGuard } from '../common/guards/policies.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { Policies } from '../common/decorators/policies.decorator';
import { PolicyAction } from '../common/policies/policy.service';

@Controller('scheduling/lessons')
@UseGuards(JwtAuthGuard, RolesGuard, PoliciesGuard)
export class LessonsController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLessonDto) {
    return this.schedulingService.createLesson(user.studioId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR, UserRole.STUDENT)
  findAll() {
    return this.schedulingService.findLessons();
  }

  @Get(':id')
  @Policies({ action: PolicyAction.Read, subject: 'Lesson', ownerField: 'studentId' })
  findOne(@Param('id') id: string) {
    return this.schedulingService.findLesson(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  update(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.schedulingService.updateLesson(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.schedulingService.removeLesson(id);
  }
}
