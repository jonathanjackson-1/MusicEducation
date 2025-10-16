import { Module } from '@nestjs/common';
import { CourseworkService } from './coursework.service';
import { TemplatesController } from './templates.controller';
import { AssignmentsController } from './assignments.controller';
import { SubmissionsController } from './submissions.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [TemplatesController, AssignmentsController, SubmissionsController],
  providers: [CourseworkService],
  exports: [CourseworkService],
})
export class CourseworkModule {}
