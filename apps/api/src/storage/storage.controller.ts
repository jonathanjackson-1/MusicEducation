import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { CreateRecordingDto } from './dto/create-recording.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@Controller('storage')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('recordings')
  @Roles(UserRole.ADMIN, UserRole.EDUCATOR, UserRole.STUDENT)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRecordingDto) {
    return this.storageService.createRecording(user, dto);
  }

  @Get('recordings')
  list() {
    return this.storageService.listRecordings();
  }
}
