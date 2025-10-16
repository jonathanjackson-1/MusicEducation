import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CourseworkService } from './coursework.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PoliciesGuard } from '../common/guards/policies.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
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
  list(
    @CurrentUser() user: AuthUser,
    @Query('studentId') studentId?: string,
    @Query('ensembleId') ensembleId?: string,
  ) {
    if (studentId) {
      return this.courseworkService.listAssignmentsForStudent(user, studentId);
    }

    if (ensembleId) {
      return this.courseworkService.listAssignmentsForEnsemble(user, ensembleId);
    }

    return this.courseworkService.listAssignmentsForUser(user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  update(@Param('id') id: string, @Body() dto: UpdateAssignmentDto) {
    return this.courseworkService.updateAssignment(id, dto);
  }
}
