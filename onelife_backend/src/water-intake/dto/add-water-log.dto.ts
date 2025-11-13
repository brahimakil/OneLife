import { IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';

export class AddWaterLogDto {
  @IsNumber()
  @Min(0)
  amount: number; // liters

  @IsDateString()
  @IsOptional()
  timestamp?: string; // If not provided, use current time

  @IsString()
  @IsOptional()
  note?: string;
}
