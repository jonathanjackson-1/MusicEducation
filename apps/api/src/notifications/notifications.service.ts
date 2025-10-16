import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(studioId: string, dto: CreateNotificationDto) {
    const payload = dto.payload
      ? (() => {
          try {
            return JSON.parse(dto.payload as string);
          } catch (error) {
            return { raw: dto.payload };
          }
        })()
      : {};

    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        payload,
        studioId,
      },
    });
  }

  list(userId: string) {
    return this.prisma.notification.findMany({ where: { userId } });
  }

  markRead(id: string, dto: UpdateNotificationDto) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        readAt: dto.read ? new Date() : null,
      },
    });
  }
}
