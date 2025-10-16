import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TemplateSectionDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  placeholders?: string[];
}

export class TemplateSectionsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateSectionDto)
  warmUps?: TemplateSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateSectionDto)
  technique?: TemplateSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateSectionDto)
  repertoire?: TemplateSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateSectionDto)
  theory?: TemplateSectionDto;
}

export class TemplateTagsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  instrument?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  level?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  syllabus?: string[];
}

export class CreateAssignmentTemplateDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  rubricId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateSectionsDto)
  sections?: TemplateSectionsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateTagsDto)
  tags?: TemplateTagsDto;
}
