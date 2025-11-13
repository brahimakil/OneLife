import { IsString, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { FoodItem } from './create-food-intake.dto';

export class AddMealDto {
  @IsString()
  @IsNotEmpty()
  mealType: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FoodItem)
  items: FoodItem[];
}
