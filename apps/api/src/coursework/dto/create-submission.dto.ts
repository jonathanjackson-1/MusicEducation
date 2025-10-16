import { IsOptional, IsString } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  assignmentId!: string;

  @IsOptional()
  @IsString()
  content?: string;
}
