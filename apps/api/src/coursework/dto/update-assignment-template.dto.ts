import { PartialType } from '@nestjs/mapped-types';
import { CreateAssignmentTemplateDto } from './create-assignment-template.dto';

export class UpdateAssignmentTemplateDto extends PartialType(CreateAssignmentTemplateDto) {}
