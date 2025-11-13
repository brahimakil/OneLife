import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { CreateDailyStatisticDto } from './dto/create-daily-statistic.dto';
import { UpdateDailyStatisticDto } from './dto/update-daily-statistic.dto';

@Injectable()
export class DailyStatisticsService {
  private readonly collectionName = 'dailyStatistics';

  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  async create(createDailyStatisticDto: CreateDailyStatisticDto) {
    const db = this.firebaseAdmin.getFirestore();
    const docRef = await db.collection(this.collectionName).add({
      ...createDailyStatisticDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const doc = await docRef.get();
    return {
      statId: doc.id,
      ...doc.data(),
    };
  }

  async findAll() {
    const db = this.firebaseAdmin.getFirestore();
    const snapshot = await db.collection(this.collectionName).get();

    return snapshot.docs.map((doc) => ({
      statId: doc.id,
      ...doc.data(),
    }));
  }

  async findOne(statId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const doc = await db.collection(this.collectionName).doc(statId).get();

    if (!doc.exists) {
      throw new NotFoundException(`Daily statistic with ID ${statId} not found`);
    }

    return {
      statId: doc.id,
      ...doc.data(),
    };
  }

  async findByUserId(userId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const snapshot = await db
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      statId: doc.id,
      ...doc.data(),
    }));
  }

  async findByUserIdAndDate(userId: string, date: string) {
    const db = this.firebaseAdmin.getFirestore();
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const snapshot = await db
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      statId: doc.id,
      ...doc.data(),
    };
  }

  async findByDateRange(startDate: string, endDate: string, userId?: string) {
    const db = this.firebaseAdmin.getFirestore();
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let query: any = db
      .collection(this.collectionName)
      .where('date', '>=', start)
      .where('date', '<=', end);

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    const snapshot = await query.orderBy('date', 'desc').get();

    return snapshot.docs.map((doc) => ({
      statId: doc.id,
      ...doc.data(),
    }));
  }

  async update(statId: string, updateDailyStatisticDto: UpdateDailyStatisticDto) {
    const db = this.firebaseAdmin.getFirestore();
    const docRef = db.collection(this.collectionName).doc(statId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Daily statistic with ID ${statId} not found`);
    }

    await docRef.update({
      ...updateDailyStatisticDto,
      updatedAt: new Date(),
    });

    const updatedDoc = await docRef.get();
    return {
      statId: updatedDoc.id,
      ...updatedDoc.data(),
    };
  }

  async remove(statId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const docRef = db.collection(this.collectionName).doc(statId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Daily statistic with ID ${statId} not found`);
    }

    await docRef.delete();
    return { message: 'Daily statistic deleted successfully' };
  }

  async getStatisticsSummary(userId?: string) {
    const db = this.firebaseAdmin.getFirestore();
    let query: any = db.collection(this.collectionName);

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    const snapshot = await query.get();
    const stats = snapshot.docs.map((doc) => doc.data());

    const totalDays = stats.length;
    const workoutCompletedCount = stats.filter((s: any) => s.workoutCompleted).length;
    const avgCaloriesConsumed = stats.reduce((sum: number, s: any) => sum + (s.consumed?.calories || 0), 0) / totalDays || 0;
    const avgCaloriesBurned = stats.reduce((sum: number, s: any) => sum + (s.burned?.calories || 0), 0) / totalDays || 0;
    const avgHydration = stats.reduce((sum: number, s: any) => sum + (s.consumed?.hydration || 0), 0) / totalDays || 0;
    const avgSleep = stats.reduce((sum: number, s: any) => sum + (s.hoursSlept || 0), 0) / totalDays || 0;

    return {
      totalDays,
      workoutCompletedCount,
      workoutCompletionRate: totalDays > 0 ? (workoutCompletedCount / totalDays) * 100 : 0,
      avgCaloriesConsumed: Math.round(avgCaloriesConsumed),
      avgCaloriesBurned: Math.round(avgCaloriesBurned),
      avgHydration: Math.round(avgHydration * 10) / 10,
      avgSleep: Math.round(avgSleep * 10) / 10,
    };
  }

  // Helper to extract date in YYYY-MM-DD format
  private extractDateString(dateValue: any): string {
    if (typeof dateValue === 'string') {
      const d = new Date(dateValue);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    } else if (dateValue && typeof dateValue === 'object' && (dateValue._seconds || dateValue.seconds)) {
      const seconds = dateValue._seconds || dateValue.seconds;
      const d = new Date(seconds * 1000);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    }
    return '';
  }

  // Recalculate and update statistics for a user on a specific date
  async recalculateStatistics(userId: string, date: string) {
    console.log('🔄 RECALCULATING STATISTICS FOR:', userId, date);
    const db = this.firebaseAdmin.getFirestore();
    const targetDateStr = this.extractDateString(date);
    console.log('📅 Target date string:', targetDateStr);

    // Find the daily statistic for this user and date
    const statsSnapshot = await db.collection(this.collectionName)
      .where('userId', '==', userId)
      .get();

    let statDoc: any = null;
    for (const doc of statsSnapshot.docs) {
      const docDate = this.extractDateString(doc.data().date);
      if (docDate === targetDateStr) {
        statDoc = doc;
        break;
      }
    }

    if (!statDoc) {
      console.log('❌ No daily statistic found for user', userId, 'on date', targetDateStr);
      return null;
    }

    console.log('✅ Found statistic document:', statDoc.id);

    // Fetch water intake
    const waterSnapshot = await db.collection('waterIntake')
      .where('userId', '==', userId)
      .get();
    
    let totalHydration = 0;
    for (const doc of waterSnapshot.docs) {
      const docDate = this.extractDateString(doc.data().date);
      if (docDate === targetDateStr) {
        totalHydration = doc.data().totalConsumed || 0;
        break;
      }
    }

    // Fetch food intake
    const foodSnapshot = await db.collection('foodIntake')
      .where('userId', '==', userId)
      .get();
    
    let totalCalories = 0;
    let totalProteins = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    
    for (const doc of foodSnapshot.docs) {
      const docDate = this.extractDateString(doc.data().date);
      if (docDate === targetDateStr) {
        const consumed = doc.data().totalConsumed || {};
        totalCalories = consumed.calories || 0;
        totalProteins = consumed.proteins || 0;
        totalCarbs = consumed.carbohydrates || 0;
        totalFats = consumed.fats || 0;
        break;
      }
    }

    // Fetch workout progress
    const workoutSnapshot = await db.collection('userWorkoutProgress')
      .where('userId', '==', userId)
      .get();
    
    let caloriesBurned = 0;
    let proteinBurned = 0;
    let carbsBurned = 0;
    let fatsBurned = 0;
    let waterLoss = 0;
    let workoutCompleted = false;
    
    for (const doc of workoutSnapshot.docs) {
      const docDate = this.extractDateString(doc.data().date);
      if (docDate === targetDateStr) {
        const data = doc.data();
        caloriesBurned = data.totalCaloriesBurned || 0;
        proteinBurned = data.totalProteinBurned || 0;
        carbsBurned = data.totalCarbsBurned || 0;
        fatsBurned = data.totalFatsBurned || 0;
        waterLoss = data.totalWaterLoss || 0;
        workoutCompleted = data.isCompleted || false;
        break;
      }
    }

    // Fetch sleep tracking
    const sleepSnapshot = await db.collection('sleepTracking')
      .where('userId', '==', userId)
      .get();
    
    let hoursSlept = 0;
    
    for (const doc of sleepSnapshot.docs) {
      const docDate = this.extractDateString(doc.data().date);
      if (docDate === targetDateStr) {
        hoursSlept = doc.data().totalHours || 0;
        break;
      }
    }

    // Update the daily statistic
    const updatedData = {
      consumed: {
        hydration: parseFloat(totalHydration.toFixed(2)),
        calories: parseFloat(totalCalories.toFixed(2)),
        proteins: parseFloat(totalProteins.toFixed(2)),
        carbohydrates: parseFloat(totalCarbs.toFixed(2)),
        fats: parseFloat(totalFats.toFixed(2)),
      },
      burned: {
        calories: parseFloat(caloriesBurned.toFixed(2)),
        proteins: parseFloat(proteinBurned.toFixed(2)),
        carbohydrates: parseFloat(carbsBurned.toFixed(2)),
        fats: parseFloat(fatsBurned.toFixed(2)),
        waterLoss: parseFloat(waterLoss.toFixed(3)),
      },
      net: {
        calories: parseFloat((totalCalories - caloriesBurned).toFixed(2)),
        proteins: parseFloat((totalProteins - proteinBurned).toFixed(2)),
        carbohydrates: parseFloat((totalCarbs - carbsBurned).toFixed(2)),
        fats: parseFloat((totalFats - fatsBurned).toFixed(2)),
        hydration: parseFloat((totalHydration - waterLoss).toFixed(3)),
      },
      hoursSlept: parseFloat(hoursSlept.toFixed(1)),
      workoutCompleted,
      updatedAt: new Date().toISOString(),
    };

    await statDoc.ref.update(updatedData);

    console.log('✅ Successfully updated daily statistics:', updatedData);

    const updated = await statDoc.ref.get();
    return {
      statId: updated.id,
      ...(updated.data() || {}),
    };
  }
}
