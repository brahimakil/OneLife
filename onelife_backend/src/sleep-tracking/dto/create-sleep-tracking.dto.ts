import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateSleepTrackingDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  bedTime: string;

  @IsString()
  @IsNotEmpty()
  wakeTime: string;

  @IsString()
  @IsNotEmpty()
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';

  @IsString()
  @IsOptional()
  notes?: string;
}
