import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  planName: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  dailyHydration: number;

  @IsNumber()
  dailyCalories: number;

  @IsNumber()
  dailyProteins: number;

  @IsNumber()
  dailyCarbohydrates: number;

  @IsNumber()
  dailyFats: number;

  @IsNumber()
  hoursOfSleep: number;

  @IsString()
  @IsNotEmpty()
  gymRoutineId: string;

  @IsNumber()
  @IsOptional()
  durationDays?: number;
}
