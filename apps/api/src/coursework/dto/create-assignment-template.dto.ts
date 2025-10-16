import { IsOptional, IsString } from 'class-validator';

export class CreateAssignmentTemplateDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  rubricId?: string;
}
