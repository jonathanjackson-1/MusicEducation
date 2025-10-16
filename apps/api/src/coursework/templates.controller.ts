import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CourseworkService } from './coursework.service';
import { CreateAssignmentTemplateDto } from './dto/create-assignment-template.dto';
import { UpdateAssignmentTemplateDto } from './dto/update-assignment-template.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@Controller('coursework/templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TemplatesController {
  constructor(private readonly courseworkService: CourseworkService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAssignmentTemplateDto) {
    return this.courseworkService.createTemplate(user.studioId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  list(@CurrentUser() user: AuthUser) {
    return this.courseworkService.listTemplates(user.studioId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR)
  update(@Param('id') id: string, @Body() dto: UpdateAssignmentTemplateDto) {
    return this.courseworkService.updateTemplate(id, dto);
  }
}
