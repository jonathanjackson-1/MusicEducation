import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CourseworkService } from './coursework.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PoliciesGuard } from '../common/guards/policies.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { Policies } from '../common/decorators/policies.decorator';
import { PolicyAction } from '../common/policies/policy.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@Controller('coursework/assignments')
@UseGuards(JwtAuthGuard, RolesGuard, PoliciesGuard)
export class AssignmentsController {
  constructor(private readonly courseworkService: CourseworkService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAssignmentDto) {
    return this.courseworkService.createAssignment(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.courseworkService.listAssignmentsForUser(user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  @Policies({ action: PolicyAction.Update, subject: 'Assignment', ownerField: 'assignedToId' })
  update(@Param('id') id: string, @Body() dto: UpdateAssignmentDto) {
    return this.courseworkService.updateAssignment(id, dto);
  }
}
