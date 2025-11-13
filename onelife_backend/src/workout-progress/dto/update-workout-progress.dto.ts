import { Type } from 'class-transformer';
import { IsString, IsDateString, IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { ExerciseCompletionDto } from './create-workout-progress.dto';

export class UpdateWorkoutProgressDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  routineId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  dayOfWeek?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseCompletionDto)
  exercises?: ExerciseCompletionDto[];

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsString()
  markedBy?: string;
}
