import { IsOptional, IsString } from 'class-validator';

export class CreateBookingRequestDto {
  @IsString()
  studentId!: string;

  @IsOptional()
  @IsString()
  lessonId?: string;
}
