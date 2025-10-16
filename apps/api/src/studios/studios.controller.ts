import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { StudiosService } from './studios.service';
import { CreateStudioDto } from './dto/create-studio.dto';
import { UpdateStudioDto } from './dto/update-studio.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';

@Controller('studios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudiosController {
  constructor(private readonly studiosService: StudiosService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateStudioDto) {
    return this.studiosService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.studiosService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.studiosService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateStudioDto) {
    return this.studiosService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.studiosService.remove(id);
  }
}
