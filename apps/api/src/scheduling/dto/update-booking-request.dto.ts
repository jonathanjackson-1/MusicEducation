import { IsEnum, IsOptional } from 'class-validator';
import { BookingRequestStatus } from '@prisma/client';

export class UpdateBookingRequestDto {
  @IsOptional()
  @IsEnum(BookingRequestStatus)
  status?: BookingRequestStatus;
}
