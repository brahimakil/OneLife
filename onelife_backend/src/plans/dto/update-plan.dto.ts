import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  planName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  dailyHydration?: number;

  @IsOptional()
  @IsNumber()
  dailyCalories?: number;

  @IsOptional()
  @IsNumber()
  dailyProteins?: number;

  @IsOptional()
  @IsNumber()
  dailyCarbohydrates?: number;

  @IsOptional()
  @IsNumber()
  dailyFats?: number;

  @IsOptional()
  @IsNumber()
  hoursOfSleep?: number;

  @IsOptional()
  @IsString()
  gymRoutineId?: string;

  @IsOptional()
  @IsNumber()
  durationDays?: number;
}
