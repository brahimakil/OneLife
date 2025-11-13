import { IsString, IsArray, IsObject, IsOptional } from 'class-validator';
import { ExerciseInRoutineDto } from './create-gym-routine.dto';

export class UpdateGymRoutineDto {
  @IsOptional()
  @IsString()
  routineName?: string;

  @IsOptional()
  @IsString()
  routineDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedDays?: string[];

  @IsOptional()
  @IsObject()
  dailyExercises?: Record<string, ExerciseInRoutineDto[]>;
}
