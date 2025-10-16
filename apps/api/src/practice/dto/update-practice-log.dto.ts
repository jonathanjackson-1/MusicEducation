import { PartialType } from '@nestjs/mapped-types';
import { CreatePracticeLogDto } from './create-practice-log.dto';

export class UpdatePracticeLogDto extends PartialType(CreatePracticeLogDto) {}
