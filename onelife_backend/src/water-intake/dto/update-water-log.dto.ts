import { IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';

export class UpdateWaterLogDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number; // liters

  @IsDateString()
  @IsOptional()
  timestamp?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
