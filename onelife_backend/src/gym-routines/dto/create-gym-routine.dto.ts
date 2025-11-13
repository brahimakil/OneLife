import { IsString, IsNotEmpty, IsArray, IsObject, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ExerciseInRoutineDto {
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  @IsString()
  @IsNotEmpty()
  exerciseName: string;

  @IsNumber()
  sets: number;

  @IsNumber()
  reps: number;

  @IsNumber()
  restSeconds: number;

  @IsNumber()
  caloriesBurned: number;

  @IsNumber()
  proteinBurned: number;

  @IsNumber()
  carbsBurned: number;

  @IsNumber()
  fatsBurned: number;

  @IsNumber()
  waterLoss: number;
}

export class CreateGymRoutineDto {
  @IsString()
  @IsNotEmpty()
  routineName: string;

  @IsString()
  @IsNotEmpty()
  routineDescription: string;

  @IsArray()
  @IsString({ each: true })
  selectedDays: string[];

  @IsObject()
  dailyExercises: Record<string, ExerciseInRoutineDto[]>;
}
