import { IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';

export class WaterLogDto {
  @IsString()
  logId: string;

  @IsNumber()
  @Min(0)
  amount: number; // liters

  @IsDateString()
  timestamp: string;

  @IsString()
  @IsOptional()
  note?: string;
}
