import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  priceCents!: number;

  @IsString()
  billingInterval!: string;

  @IsOptional()
  @IsString()
  features?: string;
}
