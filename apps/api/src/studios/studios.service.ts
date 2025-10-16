import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudioDto } from './dto/create-studio.dto';
import { UpdateStudioDto } from './dto/update-studio.dto';

@Injectable()
export class StudiosService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateStudioDto) {
    return this.prisma.studio.create({ data: dto });
  }

  findAll() {
    return this.prisma.studio.findMany();
  }

  findOne(id: string) {
    return this.prisma.studio.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateStudioDto) {
    return this.prisma.studio.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.studio.delete({ where: { id } });
  }
}
