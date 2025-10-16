import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(studioId: string, dto: CreateUserDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: dto.role,
          instrumentId: dto.instrumentId,
          studioId,
        },
      });

      await tx.studioMember.upsert({
        where: {
          studioId_userId: {
            studioId,
            userId: user.id,
          },
        },
        update: {
          role: dto.role,
          instrumentId: dto.instrumentId,
        },
        create: {
          studioId,
          userId: user.id,
          role: dto.role,
          instrumentId: dto.instrumentId,
        },
      });

      return user;
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
