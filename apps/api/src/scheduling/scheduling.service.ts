import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { CreateBookingRequestDto } from './dto/create-booking-request.dto';
import { UpdateBookingRequestDto } from './dto/update-booking-request.dto';

@Injectable()
export class SchedulingService {
  constructor(private readonly prisma: PrismaService) {}

  createLesson(studioId: string, dto: CreateLessonDto) {
    return this.prisma.lesson.create({
      data: {
        ...dto,
        studioId,
      },
      include: { occurrences: true, exceptions: true },
    });
  }

  updateLesson(id: string, dto: UpdateLessonDto) {
    return this.prisma.lesson.update({ where: { id }, data: dto });
  }

  findLessons() {
    return this.prisma.lesson.findMany({ include: { occurrences: true, exceptions: true } });
  }

  findLesson(id: string) {
    return this.prisma.lesson.findUnique({ where: { id }, include: { occurrences: true, exceptions: true } });
  }

  removeLesson(id: string) {
    return this.prisma.lesson.delete({ where: { id } });
  }

  createAvailability(studioId: string, dto: CreateAvailabilityDto) {
    return this.prisma.availabilityBlock.create({
      data: {
        ...dto,
        studioId,
      },
    });
  }

  updateAvailability(id: string, dto: UpdateAvailabilityDto) {
    return this.prisma.availabilityBlock.update({ where: { id }, data: dto });
  }

  listAvailability() {
    return this.prisma.availabilityBlock.findMany();
  }

  removeAvailability(id: string) {
    return this.prisma.availabilityBlock.delete({ where: { id } });
  }

  createBookingRequest(studioId: string, dto: CreateBookingRequestDto) {
    return this.prisma.bookingRequest.create({
      data: {
        ...dto,
        studioId,
      },
    });
  }

  updateBookingRequest(id: string, dto: UpdateBookingRequestDto) {
    return this.prisma.bookingRequest.update({ where: { id }, data: dto });
  }

  listBookingRequests() {
    return this.prisma.bookingRequest.findMany();
  }
}
