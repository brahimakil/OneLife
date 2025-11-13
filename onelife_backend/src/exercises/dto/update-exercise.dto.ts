import { IsString, IsNumber, IsArray, IsOptional, IsIn } from 'class-validator';

export class UpdateExerciseDto {
  @IsString()
  @IsOptional()
  exerciseName?: string;

  @IsString()
  @IsOptional()
  @IsIn(['cardio', 'strength', 'flexibility', 'sports'])
  category?: string;

  @IsString()
  @IsOptional()
  @IsIn(['chest', 'back', 'legs', 'arms', 'shoulders', 'core', 'full-body'])
  muscleGroup?: string;

  @IsString()
  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  difficulty?: string;

  @IsNumber()
  @IsOptional()
  defaultSets?: number;

  @IsNumber()
  @IsOptional()
  defaultReps?: number;

  @IsNumber()
  @IsOptional()
  defaultRestSeconds?: number;

  @IsNumber()
  @IsOptional()
  caloriesBurnedPerSet?: number;

  @IsNumber()
  @IsOptional()
  proteinBurnedPerSet?: number;

  @IsNumber()
  @IsOptional()
  carbsBurnedPerSet?: number;

  @IsNumber()
  @IsOptional()
  fatsBurnedPerSet?: number;

  @IsNumber()
  @IsOptional()
  waterLossPerSet?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  instructions?: string[];

  @IsString()
  @IsOptional()
  videoUrl?: string;
}
