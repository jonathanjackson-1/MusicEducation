import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { CreatePracticeLogDto } from './dto/create-practice-log.dto';
import { UpdatePracticeLogDto } from './dto/update-practice-log.dto';
import { CreatePracticeGoalDto } from './dto/create-practice-goal.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PoliciesGuard } from '../common/guards/policies.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { Policies } from '../common/decorators/policies.decorator';
import { PolicyAction } from '../common/policies/policy.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@Controller('practice')
@UseGuards(JwtAuthGuard, RolesGuard, PoliciesGuard)
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Post('logs')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.EDUCATOR)
  createLog(@CurrentUser() user: AuthUser, @Body() dto: CreatePracticeLogDto) {
    return this.practiceService.createLog(user, dto);
  }

  @Get('logs')
  listLogs(@CurrentUser() user: AuthUser) {
    return this.practiceService.listLogs(user);
  }

  @Patch('logs/:id')
  @Policies({ action: PolicyAction.Update, subject: 'PracticeLog', ownerField: 'studentId' })
  updateLog(@Param('id') id: string, @Body() dto: UpdatePracticeLogDto) {
    return this.practiceService.updateLog(id, dto);
  }

  @Post('goals')
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  createGoal(@CurrentUser() user: AuthUser, @Body() dto: CreatePracticeGoalDto) {
    return this.practiceService.createGoal(user.studioId, dto);
  }
}
