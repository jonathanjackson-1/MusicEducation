import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CourseworkService } from './coursework.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@Controller('coursework/submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubmissionsController {
  constructor(private readonly courseworkService: CourseworkService) {}

  @Post()
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.EDUCATOR)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSubmissionDto) {
    return this.courseworkService.createSubmission(user, dto);
  }
}
