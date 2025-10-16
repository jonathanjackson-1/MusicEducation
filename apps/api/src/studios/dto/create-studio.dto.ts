import { IsString } from 'class-validator';

export class CreateStudioDto {
  @IsString()
  name!: string;

  @IsString()
  subdomain!: string;

  @IsString()
  timeZone!: string;
}
