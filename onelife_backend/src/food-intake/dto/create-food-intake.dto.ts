import { IsString, IsNumber, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class FoodItem {
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  calories: number;

  @IsNumber()
  proteins: number;

  @IsNumber()
  carbohydrates: number;

  @IsNumber()
  fats: number;
}

export class Meal {
  @IsString()
  @IsNotEmpty()
  mealType: string;

  @IsString()
  @IsNotEmpty()
  timestamp: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FoodItem)
  items: FoodItem[];
}

export class DailyTargets {
  @IsNumber()
  calories: number;

  @IsNumber()
  proteins: number;

  @IsNumber()
  carbohydrates: number;

  @IsNumber()
  fats: number;
}

export class CreateFoodIntakeDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Meal)
  meals: Meal[];

  @ValidateNested()
  @Type(() => DailyTargets)
  dailyTargets: DailyTargets;
}
