import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';
import { OAuthDto } from './dto/oauth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TotpDto } from './dto/totp.dto';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/password-reset.dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Req() req: Request, @Body() dto: RegisterDto) {
    return this.authService.register(req.studioId as string, dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request, @Body() dto: LoginDto) {
    const user = req.user as AuthUser;
    return this.authService.login(user, dto);
  }

  @Post('oauth')
  async oauth(@Req() req: Request, @Body() dto: OAuthDto) {
    return this.authService.oauthLogin(req.studioId as string, dto);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  async refresh(@CurrentUser() user: AuthUser, @Body() dto: RefreshTokenDto) {
    return this.authService.refresh(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('totp')
  async setTotp(@CurrentUser() user: AuthUser, @Body() dto: TotpDto) {
    return this.authService.setTotp(user.id, dto.enable ?? true, dto.code);
  }

  @Post('password/reset/request')
  async requestReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('password/reset/confirm')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
