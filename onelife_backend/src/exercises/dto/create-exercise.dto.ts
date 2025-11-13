import { IsString, IsNotEmpty, IsNumber, IsArray, IsOptional, IsIn } from 'class-validator';

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  exerciseName: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['cardio', 'strength', 'flexibility', 'sports'])
  category: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['chest', 'back', 'legs', 'arms', 'shoulders', 'core', 'full-body'])
  muscleGroup: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  difficulty: string;

  @IsNumber()
  @IsNotEmpty()
  defaultSets: number;

  @IsNumber()
  @IsNotEmpty()
  defaultReps: number;

  @IsNumber()
  @IsNotEmpty()
  defaultRestSeconds: number;

  @IsNumber()
  @IsNotEmpty()
  caloriesBurnedPerSet: number;

  @IsNumber()
  @IsNotEmpty()
  proteinBurnedPerSet: number;

  @IsNumber()
  @IsNotEmpty()
  carbsBurnedPerSet: number;

  @IsNumber()
  @IsNotEmpty()
  fatsBurnedPerSet: number;

  @IsNumber()
  @IsNotEmpty()
  waterLossPerSet: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  instructions: string[];

  @IsString()
  @IsOptional()
  videoUrl?: string;
}
