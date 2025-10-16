import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecordingDto } from './dto/create-recording.dto';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@Injectable()
export class StorageService {
  constructor(private readonly prisma: PrismaService) {}

  createRecording(user: AuthUser, dto: CreateRecordingDto) {
    return this.prisma.recording.create({
      data: {
        ...dto,
        studioId: user.studioId,
      },
    });
  }

  listRecordings() {
    return this.prisma.recording.findMany();
  }
}
