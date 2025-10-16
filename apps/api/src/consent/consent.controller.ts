import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateParentalConsentDto } from './dto/create-parental-consent.dto';
import { CreateDataRequestDto } from './dto/create-data-request.dto';

@Controller('consents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateConsentDto) {
    return this.consentService.create(user, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  list(@CurrentUser() user: AuthUser) {
    return this.consentService.list(user.studioId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateConsentDto) {
    return this.consentService.update(id, user, dto);
  }

  @Post('parental')
  @Roles(UserRole.ADMIN)
  recordParental(@CurrentUser() user: AuthUser, @Body() dto: CreateParentalConsentDto) {
    return this.consentService.recordParentalConsent(user, dto);
  }

  @Post('data-requests')
  @Roles(UserRole.ADMIN)
  createDataRequest(@CurrentUser() user: AuthUser, @Body() dto: CreateDataRequestDto) {
    return this.consentService.createDataRequest(user, dto);
  }

  @Get('data-requests')
  @Roles(UserRole.ADMIN)
  listDataRequests(@CurrentUser() user: AuthUser) {
    return this.consentService.listDataRequests(user.studioId);
  }
}
