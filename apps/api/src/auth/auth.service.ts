import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { UserRole } from '../common/interfaces/user-role.enum';
import { LoginDto } from './dto/login.dto';
import * as argon from 'argon2';
import { authenticator } from 'otplib';
import { v4 as uuid } from 'uuid';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { OAuthDto } from './dto/oauth.dto';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/password-reset.dto';

@Injectable()
export class AuthService {
  private readonly accessTokenTtl: string;
  private readonly refreshTokenTtl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenTtl = this.configService.get('JWT_ACCESS_TTL', '15m');
    this.refreshTokenTtl = this.configService.get('JWT_REFRESH_TTL', '7d');
    authenticator.options = { window: 1 };
  }

  async register(studioId: string, dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    let role = dto.role as UserRole;
    let inviteRecord: { id: string } | null = null;
    if (dto.inviteToken) {
      const invite = await this.prisma.studioInvite.findUnique({ where: { token: dto.inviteToken } });
      if (!invite || invite.expiresAt < new Date()) {
        throw new BadRequestException('Invalid invite token');
      }
      if (invite.studioId !== studioId) {
        throw new BadRequestException('Invite token does not match studio');
      }
      role = invite.role as UserRole;
      inviteRecord = { id: invite.id };
    }

    const passwordHash = await argon.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role,
          studio: { connect: { id: studioId } },
          invite: inviteRecord ? { connect: { id: inviteRecord.id } } : undefined,
        },
      });

      await tx.studioMember.upsert({
        where: {
          studioId_userId: {
            studioId,
            userId: created.id,
          },
        },
        update: { role },
        create: {
          studioId,
          userId: created.id,
          role,
        },
      });

      if (inviteRecord) {
        await tx.studioInvite.update({
          where: { id: inviteRecord.id },
          data: { users: { connect: { id: created.id } } },
        });
      }

      return created;
    });

    return this.buildAuthResponse(user);
  }

  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return null;
    }
    const passwordValid = await argon.verify(user.passwordHash, password);
    if (!passwordValid) {
      return null;
    }

    if (user.totpEnabled) {
      return {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        studioId: user.studioId,
        totpVerified: false,
      };
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      studioId: user.studioId,
    };
  }

  async login(user: AuthUser, dto: LoginDto) {
    if (user.totpVerified === false) {
      await this.verifyTotp(user.id, dto.totpCode);
      user.totpVerified = true;
    }

    return this.generateTokens(user);
  }

  async oauthLogin(studioId: string, dto: OAuthDto) {
    const email = `${dto.provider.toLowerCase()}+${dto.token}@oauth.local`;
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          firstName: dto.provider,
          lastName: 'User',
          role: UserRole.STUDENT,
          oauthProvider: dto.provider,
          oauthSubject: dto.token,
          studio: { connect: { id: studioId } },
        },
      });
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      studioId: user.studioId,
    };
    return this.generateTokens(authUser);
  }

  async refresh(user: AuthUser, dto: RefreshTokenDto) {
    const isValid = await this.validateRefreshToken(user.id, dto.refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return this.generateTokens(user);
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.hashedRefreshToken) {
      return false;
    }
    return argon.verify(user.hashedRefreshToken, refreshToken);
  }

  async setTotp(userId: string, enabled: boolean, code: string) {
    const secret = enabled ? authenticator.generateSecret() : null;
    if (enabled) {
      const verified = authenticator.verify({ token: code, secret: secret ?? undefined });
      if (!verified) {
        throw new UnauthorizedException('Invalid TOTP code');
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpEnabled: enabled,
        totpSecret: secret,
      },
    });

    return { enabled };
  }

  async verifyTotp(userId: string, token?: string) {
    if (!token) {
      throw new UnauthorizedException('TOTP code required');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecret) {
      throw new UnauthorizedException('TOTP not configured');
    }
    const verified = authenticator.verify({ token, secret: user.totpSecret });
    if (!verified) {
      throw new UnauthorizedException('Invalid TOTP code');
    }
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      return { ok: true };
    }

    const token = uuid();
    await this.prisma.auditLog.create({
      data: {
        studioId: user.studioId,
        actorId: user.id,
        action: 'password.reset.request',
        targetType: 'user',
        targetId: user.id,
        metadata: { token },
      },
    });

    return { token };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const audit = await this.prisma.auditLog.findFirst({
      where: {
        action: 'password.reset.request',
        metadata: { path: ['token'], equals: dto.token },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!audit?.targetId) {
      throw new UnauthorizedException('Invalid reset token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: audit.targetId } });
    if (!user) {
      throw new UnauthorizedException('Invalid reset token');
    }

    if (user.totpEnabled) {
      await this.verifyTotp(user.id, dto.totpCode);
    }

    const passwordHash = await argon.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        hashedRefreshToken: null,
      },
    });

    return { ok: true };
  }

  private async generateTokens(user: AuthUser) {
    const payload: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      studioId: user.studioId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.accessTokenTtl,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.refreshTokenTtl,
      secret: this.configService.get('JWT_REFRESH_SECRET', 'development-refresh-secret'),
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        hashedRefreshToken: await argon.hash(refreshToken),
      },
    });

    return { accessToken, refreshToken };
  }

  private buildAuthResponse(user: { id: string; email: string; role: UserRole; studioId: string }) {
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      studioId: user.studioId,
    };
    return this.generateTokens(authUser);
  }
}
