import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../common/interfaces/user-role.enum';

const mockPrisma = () => {
  const prisma: any = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    studioMember: {
      upsert: jest.fn(),
    },
    studioInvite: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(async (callback: any) => callback(prisma)),
  };
  return prisma;
};

describe('AuthService', () => {
  const configService = {
    get: jest.fn((key: string, defaultValue?: any) => defaultValue ?? `test-${key}`),
  } as unknown as ConfigService;

  let prisma: ReturnType<typeof mockPrisma>;
  let service: AuthService;

  beforeEach(() => {
    prisma = mockPrisma();
    const jwtService = new JwtService({ secret: 'test-secret' });
    service = new AuthService(prisma as any, jwtService, configService);
  });

  it('registers a new user and returns access credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      studioId: 'studio-1',
    });
    prisma.user.update.mockResolvedValue({});

    const dto: RegisterDto = {
      email: 'admin@example.com',
      password: 'strongPassword!1',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.ADMIN,
    };

    const result = await service.register('studio-1', dto);

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(prisma.studioMember.upsert).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } }),
    );
  });

  it('rejects duplicate registrations', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.register('studio-1', {
        email: 'admin@example.com',
        password: 'strongPassword!1',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ADMIN,
      }),
    ).rejects.toThrow('Email already registered');
  });
});
