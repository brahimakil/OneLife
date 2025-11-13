import { IsString, IsDateString, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { WaterLogDto } from './water-log.dto';

export class CreateWaterIntakeDto {
  @IsString()
  userId: string;

  @IsDateString()
  date: string; // Start of day

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WaterLogDto)
  logs: WaterLogDto[];

  @IsNumber()
  @Min(0)
  dailyTarget: number; // liters
}
