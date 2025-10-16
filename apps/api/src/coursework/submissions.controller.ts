import { Body, Controller, Param, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CourseworkService } from './coursework.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
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
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 5 }]))
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSubmissionDto,
    @UploadedFiles()
    files: {
      files?: Express.Multer.File[];
    },
  ) {
    return this.courseworkService.createSubmission(user, dto, files?.files ?? []);
  }

  @Post(':id/grade')
  @Roles(UserRole.EDUCATOR, UserRole.ADMIN)
  grade(
    @CurrentUser() user: AuthUser,
    @Param('id') submissionId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.courseworkService.gradeSubmission(user, submissionId, dto);
  }
}
