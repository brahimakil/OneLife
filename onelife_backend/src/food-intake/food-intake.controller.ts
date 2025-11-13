import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FoodIntakeService } from './food-intake.service';
import { CreateFoodIntakeDto } from './dto/create-food-intake.dto';
import { AddMealDto } from './dto/add-meal.dto';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';

@Controller('food-intake')
@UseGuards(JwtAuthGuard)
export class FoodIntakeController {
  constructor(private readonly foodIntakeService: FoodIntakeService) {}

  @Post()
  create(@Body() createDto: CreateFoodIntakeDto) {
    return this.foodIntakeService.createFoodIntake(createDto);
  }

  @Get()
  findAll() {
    return this.foodIntakeService.getAllFoodIntake();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.foodIntakeService.getFoodIntakeByUser(userId);
  }

  @Get('user/:userId/date/:date')
  findByUserAndDate(
    @Param('userId') userId: string,
    @Param('date') date: string,
  ) {
    return this.foodIntakeService.getFoodIntakeByUserAndDate(userId, date);
  }

  @Post(':foodId/meal')
  addMeal(
    @Param('foodId') foodId: string,
    @Body() addMealDto: AddMealDto,
  ) {
    return this.foodIntakeService.addMeal(foodId, addMealDto);
  }

  @Delete(':foodId/meal/:mealId')
  deleteMeal(
    @Param('foodId') foodId: string,
    @Param('mealId') mealId: string,
  ) {
    return this.foodIntakeService.deleteMeal(foodId, mealId);
  }

  @Delete(':foodId')
  delete(@Param('foodId') foodId: string) {
    return this.foodIntakeService.deleteFoodIntake(foodId);
  }
}
