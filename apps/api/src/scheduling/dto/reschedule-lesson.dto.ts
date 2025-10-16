import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';

export enum RescheduleAction {
  Propose = 'propose',
  Accept = 'accept',
  Decline = 'decline',
}

export class RescheduleProposalDto {
  @IsString()
  id!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;
}

export class RescheduleLessonDto {
  @IsEnum(RescheduleAction)
  action!: RescheduleAction;

  @IsDateString()
  originalStart!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RescheduleProposalDto)
  proposals?: RescheduleProposalDto[];

  @IsOptional()
  @IsString()
  proposalId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
