import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CourseworkService } from './coursework.service';
import { TemplatesController } from './templates.controller';
import { AssignmentsController } from './assignments.controller';
import { SubmissionsController } from './submissions.controller';
import { CommonModule } from '../common/common.module';
import { SubmissionStorageService } from './submission-storage.service';
import { AntivirusService } from './antivirus.service';

@Module({
  imports: [CommonModule, ConfigModule],
  controllers: [TemplatesController, AssignmentsController, SubmissionsController],
  providers: [CourseworkService, SubmissionStorageService, AntivirusService],
  exports: [CourseworkService],
})
export class CourseworkModule {}
