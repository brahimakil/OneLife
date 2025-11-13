import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { DailyStatisticsService } from '../daily-statistics/daily-statistics.service';
import { CreateFoodIntakeDto } from './dto/create-food-intake.dto';
import { AddMealDto } from './dto/add-meal.dto';

@Injectable()
export class FoodIntakeService {
  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly dailyStatisticsService: DailyStatisticsService,
  ) {}

  async createFoodIntake(createDto: CreateFoodIntakeDto) {
    const db = this.firebaseAdmin.getFirestore();
    
    // Check if intake already exists for this user and date
    const dateStr = new Date(createDto.date).toISOString().split('T')[0];
    const existingQuery = await db.collection('foodIntake')
      .where('userId', '==', createDto.userId)
      .where('date', '>=', dateStr + 'T00:00:00Z')
      .where('date', '<=', dateStr + 'T23:59:59Z')
      .get();

    if (!existingQuery.empty) {
      throw new ConflictException('Food intake already exists for this date');
    }

    const foodIntakeRef = db.collection('foodIntake').doc();
    const foodIntakeData = {
      foodId: foodIntakeRef.id,
      userId: createDto.userId,
      date: createDto.date,
      meals: createDto.meals || [],
      totalConsumed: {
        calories: 0,
        proteins: 0,
        carbohydrates: 0,
        fats: 0,
      },
      dailyTargets: {
        calories: createDto.dailyTargets.calories,
        proteins: createDto.dailyTargets.proteins,
        carbohydrates: createDto.dailyTargets.carbohydrates,
        fats: createDto.dailyTargets.fats,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await foodIntakeRef.set(foodIntakeData);
    return foodIntakeData;
  }

  async getAllFoodIntake() {
    const db = this.firebaseAdmin.getFirestore();
    const snapshot = await db.collection('foodIntake')
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      foodId: doc.data().foodId || doc.id, // Ensure foodId is always present
    }));
  }

  async getFoodIntakeByUser(userId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const snapshot = await db.collection('foodIntake')
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      foodId: doc.data().foodId || doc.id, // Ensure foodId is always present
    }));
  }

  async getFoodIntakeByUserAndDate(userId: string, date: string) {
    const db = this.firebaseAdmin.getFirestore();
    const dateStr = date.includes('T') ? date.split('T')[0] : date;
    
    const snapshot = await db.collection('foodIntake')
      .where('userId', '==', userId)
      .where('date', '>=', dateStr + 'T00:00:00Z')
      .where('date', '<=', dateStr + 'T23:59:59Z')
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      ...doc.data(),
      foodId: doc.data().foodId || doc.id, // Ensure foodId is always present
    };
  }

  async addMeal(foodId: string, addMealDto: AddMealDto) {
    const db = this.firebaseAdmin.getFirestore();
    const foodIntakeRef = db.collection('foodIntake').doc(foodId);
    const doc = await foodIntakeRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Food intake not found');
    }

    const intakeData = doc.data();
    if (!intakeData) {
      throw new NotFoundException('Food intake data not found');
    }

    // Calculate meal total
    const mealTotal = addMealDto.items.reduce((total, item) => ({
      calories: total.calories + item.calories,
      proteins: total.proteins + item.proteins,
      carbohydrates: total.carbohydrates + item.carbohydrates,
      fats: total.fats + item.fats,
    }), { calories: 0, proteins: 0, carbohydrates: 0, fats: 0 });

    // Convert items to plain objects
    const plainItems = addMealDto.items.map(item => ({
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      calories: item.calories,
      proteins: item.proteins,
      carbohydrates: item.carbohydrates,
      fats: item.fats,
    }));

    const newMeal = {
      mealId: db.collection('temp').doc().id,
      mealType: addMealDto.mealType,
      timestamp: new Date().toISOString(),
      items: plainItems,
      mealTotal,
    };

    const updatedMeals = [...(intakeData.meals || []), newMeal];

    // Recalculate total consumed
    const totalConsumed = updatedMeals.reduce((total, meal) => ({
      calories: total.calories + meal.mealTotal.calories,
      proteins: total.proteins + meal.mealTotal.proteins,
      carbohydrates: total.carbohydrates + meal.mealTotal.carbohydrates,
      fats: total.fats + meal.mealTotal.fats,
    }), { calories: 0, proteins: 0, carbohydrates: 0, fats: 0 });

    await foodIntakeRef.update({
      meals: updatedMeals,
      totalConsumed: {
        calories: parseFloat(totalConsumed.calories.toFixed(2)),
        proteins: parseFloat(totalConsumed.proteins.toFixed(2)),
        carbohydrates: parseFloat(totalConsumed.carbohydrates.toFixed(2)),
        fats: parseFloat(totalConsumed.fats.toFixed(2)),
      },
      updatedAt: new Date().toISOString(),
    });

    // Recalculate daily statistics
    await this.dailyStatisticsService.recalculateStatistics(intakeData.userId, intakeData.date);

    const updated = await foodIntakeRef.get();
    return {
      ...updated.data(),
      foodId: updated.data()?.foodId || foodId, // Ensure foodId is present
    };
  }

  async deleteMeal(foodId: string, mealId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const foodIntakeRef = db.collection('foodIntake').doc(foodId);
    const doc = await foodIntakeRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Food intake not found');
    }

    const intakeData = doc.data();
    if (!intakeData) {
      throw new NotFoundException('Food intake data not found');
    }

    const updatedMeals = intakeData.meals.filter(meal => meal.mealId !== mealId);

    // Recalculate total consumed
    const totalConsumed = updatedMeals.reduce((total, meal) => ({
      calories: total.calories + meal.mealTotal.calories,
      proteins: total.proteins + meal.mealTotal.proteins,
      carbohydrates: total.carbohydrates + meal.mealTotal.carbohydrates,
      fats: total.fats + meal.mealTotal.fats,
    }), { calories: 0, proteins: 0, carbohydrates: 0, fats: 0 });

    await foodIntakeRef.update({
      meals: updatedMeals,
      totalConsumed: {
        calories: parseFloat(totalConsumed.calories.toFixed(2)),
        proteins: parseFloat(totalConsumed.proteins.toFixed(2)),
        carbohydrates: parseFloat(totalConsumed.carbohydrates.toFixed(2)),
        fats: parseFloat(totalConsumed.fats.toFixed(2)),
      },
      updatedAt: new Date().toISOString(),
    });

    // Recalculate daily statistics
    await this.dailyStatisticsService.recalculateStatistics(intakeData.userId, intakeData.date);

    const updated = await foodIntakeRef.get();
    return {
      ...updated.data(),
      foodId: updated.data()?.foodId || foodId, // Ensure foodId is present
    };
  }

  async deleteFoodIntake(foodId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const foodIntakeRef = db.collection('foodIntake').doc(foodId);
    const doc = await foodIntakeRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Food intake not found');
    }

    await foodIntakeRef.delete();
    return { message: 'Food intake deleted successfully' };
  }
}
