import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsDateString, IsArray, IsBoolean, IsNumber, IsOptional, ValidateNested } from 'class-validator';

export class ExerciseCompletionDto {
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  @IsString()
  @IsNotEmpty()
  exerciseName: string;

  @IsBoolean()
  isCompleted: boolean;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsNumber()
  setsCompleted: number;

  @IsArray()
  @IsNumber({}, { each: true })
  repsPerSet: number[];

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

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateWorkoutProgressDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsString()
  @IsNotEmpty()
  routineId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  dayOfWeek: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseCompletionDto)
  exercises: ExerciseCompletionDto[];

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @IsString()
  @IsNotEmpty()
  markedBy: string;
}
