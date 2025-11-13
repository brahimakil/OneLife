import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  // Helper to extract date in YYYY-MM-DD format from various date formats
  // Handles: ISO strings, Firestore Timestamps, and timezone issues
  private extractDateString(dateValue: any): string {
    if (typeof dateValue === 'string') {
      // Parse the ISO string and get the date in UTC
      const d = new Date(dateValue);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    } else if (dateValue && typeof dateValue === 'object' && (dateValue._seconds || dateValue.seconds)) {
      // Firestore Timestamp
      const seconds = dateValue._seconds || dateValue.seconds;
      const d = new Date(seconds * 1000);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    }
    return '';
  }

  // Run every 5 seconds for testing
  @Cron('*/5 * * * * *')
  async createDailyProgressRecords() {
    this.logger.log('=== STARTING DAILY PROGRESS RECORDS CREATION ===');
    this.logger.log(`Current time: ${new Date().toISOString()}`);
    
    try {
      const db = this.firebaseAdmin.getFirestore();
      
      // Create today's date at midnight UTC to avoid timezone issues
      const now = new Date();
      const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });

      // Get all users
      const usersSnapshot = await db.collection('users').get();
      const users: any[] = usersSnapshot.docs.map(doc => ({
        userId: doc.id,
        email: doc.data().email,
        ...doc.data(),
      }));

      this.logger.log(`Found ${users.length} users to process`);

      for (const user of users) {
        this.logger.log(`\n--- Processing user: ${user.email} ---`);
        
        // Check if user has an active subscription
        const activeSubsSnapshot = await db
          .collection('subscriptions')
          .where('userId', '==', user.uid)
          .where('isActive', '==', true)
          .limit(1)
          .get();

        if (activeSubsSnapshot.empty) {
          this.logger.log(`  ❌ User has no active subscription - skipping`);
          continue;
        }

        const subscription: any = activeSubsSnapshot.docs[0].data();
        this.logger.log(`  ✓ User has active subscription with plan ID: ${subscription.planId}`);

        // Get user's plan from subscription
        const planDoc = await db.collection('plans').doc(subscription.planId).get();
        if (!planDoc.exists) {
          this.logger.log(`  ❌ Plan not found - skipping`);
          continue;
        }
        const plan: any = planDoc.data();
        this.logger.log(`  ✓ Plan loaded successfully`);

        // Get the routine associated with the plan
        let routine: any = null;
        if (plan.gymRoutineId) {
          this.logger.log(`  ✓ Plan has gym routine ID: ${plan.gymRoutineId}`);
          const routineDoc = await db.collection('gymRoutines').doc(plan.gymRoutineId).get();
          if (routineDoc.exists) {
            routine = { routineId: routineDoc.id, ...routineDoc.data() };
            this.logger.log(`  ✓ Routine loaded successfully`);
          } else {
            this.logger.log(`  ⚠ Routine not found`);
          }
        } else {
          this.logger.log(`  ⚠ Plan has no gym routine`);
        }

        // 1. Create Workout Progress
        this.logger.log(`  📝 Creating workout progress...`);
        await this.createWorkoutProgress(user, plan, routine, today, dayOfWeek, subscription);

        // 2. Create Water Intake
        this.logger.log(`  💧 Creating water intake...`);
        await this.createWaterIntake(user, plan, today, subscription);

        // 3. Create Food Intake
        this.logger.log(`  🍽️ Creating food intake...`);
        await this.createFoodIntake(user, plan, today, subscription);

        // 4. Create Sleep Tracking (for previous night)
        this.logger.log(`  😴 Creating sleep tracking...`);
        await this.createSleepTracking(user, plan, today, subscription);

        // 5. Create Daily Statistics
        this.logger.log(`  📊 Creating daily statistics...`);
        await this.createDailyStatistics(user, plan, today, subscription);

        this.logger.log(`✅ Completed all records for user: ${user.email}`);
      }

      this.logger.log('\n=== DAILY PROGRESS RECORDS CREATION COMPLETED ===\n');
    } catch (error) {
      this.logger.error('Error creating daily progress records:', error);
    }
  }

  private async createWorkoutProgress(user: any, plan: any, routine: any, date: Date, dayOfWeek: string, subscription: any) {
    const db = this.firebaseAdmin.getFirestore();
    
    // Get all workout progress records for this user (check both UID and email for backward compatibility)
    const allRecordsSnapshot = await db
      .collection('userWorkoutProgress')
      .where('userId', 'in', [user.uid, user.email])
      .get();

    // Check if any record matches today's date (compare only date part)
    const targetDateStr = this.extractDateString(date.toISOString());
    const exists = allRecordsSnapshot.docs.some(doc => {
      const recordDate = doc.data().date;
      const recordDateStr = this.extractDateString(recordDate);
      const matches = recordDateStr === targetDateStr;
      if (matches) {
        this.logger.log(`    Found existing record with date: ${recordDate} (normalized: ${recordDateStr})`);
      }
      return matches;
    });

    if (exists) {
      this.logger.log(`    ⚠ Workout progress already exists for today`);
      return;
    }

    // Get exercises for today from routine
    const exercises: any[] = [];
    if (routine && routine.dailyExercises && routine.dailyExercises[dayOfWeek]) {
      const todayExercises = routine.dailyExercises[dayOfWeek];
      for (const ex of todayExercises) {
        exercises.push({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          isCompleted: false,
          completedAt: null,
          setsCompleted: 0,
          repsPerSet: [],
          caloriesBurned: 0,
          proteinBurned: 0,
          carbsBurned: 0,
          fatsBurned: 0,
          waterLoss: 0,
          notes: '',
        });
      }
    }

    const progressRef = db.collection('userWorkoutProgress').doc();
    await progressRef.set({
      progressId: progressRef.id,
      userId: user.uid,
      planId: subscription.planId,
      routineId: routine?.routineId || '',
      date: date.toISOString(),
      dayOfWeek: dayOfWeek,
      exercises: exercises,
      totalCaloriesBurned: 0,
      totalProteinBurned: 0,
      totalCarbsBurned: 0,
      totalFatsBurned: 0,
      totalWaterLoss: 0,
      completedExercises: 0,
      totalExercises: exercises.length,
      completionPercentage: 0,
      isCompleted: false,
      markedBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  private async createWaterIntake(user: any, plan: any, date: Date, subscription: any) {
    const db = this.firebaseAdmin.getFirestore();
    
    // Get all water intake records for this user (check both UID and email)
    const allRecordsSnapshot = await db
      .collection('waterIntake')
      .where('userId', 'in', [user.uid, user.email])
      .get();

    // Check if any record matches today's date
    const targetDateStr = this.extractDateString(date.toISOString());
    const exists = allRecordsSnapshot.docs.some(doc => {
      const recordDate = doc.data().date;
      const recordDateStr = this.extractDateString(recordDate);
      return recordDateStr === targetDateStr;
    });

    if (exists) {
      this.logger.log(`    ⚠ Water intake already exists for today`);
      return;
    }

    await db.collection('waterIntake').add({
      userId: user.uid,
      date: date.toISOString(),
      logs: [],
      totalConsumed: 0,
      dailyTarget: plan.dailyHydration || 2.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  private async createFoodIntake(user: any, plan: any, date: Date, subscription: any) {
    const db = this.firebaseAdmin.getFirestore();
    
    // Get all food intake records for this user (check both UID and email)
    const allRecordsSnapshot = await db
      .collection('foodIntake')
      .where('userId', 'in', [user.uid, user.email])
      .get();

    // Check if any record matches today's date
    const targetDateStr = this.extractDateString(date.toISOString());
    const exists = allRecordsSnapshot.docs.some(doc => {
      const recordDate = doc.data().date;
      const recordDateStr = this.extractDateString(recordDate);
      return recordDateStr === targetDateStr;
    });

    if (exists) {
      this.logger.log(`    ⚠ Food intake already exists for today`);
      return;
    }

    const foodRef = db.collection('foodIntake').doc();
    await foodRef.set({
      foodId: foodRef.id,
      userId: user.uid,
      date: date.toISOString(),
      meals: [],
      totalConsumed: {
        calories: 0,
        proteins: 0,
        carbohydrates: 0,
        fats: 0,
      },
      dailyTargets: {
        calories: plan.dailyCalories || 2000,
        proteins: plan.dailyProteins || 120,
        carbohydrates: plan.dailyCarbohydrates || 150,
        fats: plan.dailyFats || 50,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  private async createSleepTracking(user: any, plan: any, date: Date, subscription: any) {
    const db = this.firebaseAdmin.getFirestore();
    
    // Get all sleep tracking records for this user (check both UID and email)
    const allRecordsSnapshot = await db
      .collection('sleepTracking')
      .where('userId', 'in', [user.uid, user.email])
      .get();

    // Check if any record matches today's date
    const targetDateStr = this.extractDateString(date.toISOString());
    const exists = allRecordsSnapshot.docs.some(doc => {
      const recordDate = doc.data().date;
      const recordDateStr = this.extractDateString(recordDate);
      return recordDateStr === targetDateStr;
    });

    if (exists) {
      this.logger.log(`    ⚠ Sleep tracking already exists for today`);
      return;
    }

    await db.collection('sleepTracking').add({
      userId: user.uid,
      date: date.toISOString(),
      bedTime: null,
      wakeTime: null,
      totalHours: 0,
      sleepQuality: '',
      notes: '',
      targetHours: plan.hoursOfSleep || 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  private async createDailyStatistics(user: any, plan: any, date: Date, subscription: any) {
    const db = this.firebaseAdmin.getFirestore();
    
    // Get all daily statistics records for this user (check both UID and email)
    const allRecordsSnapshot = await db
      .collection('dailyStatistics')
      .where('userId', 'in', [user.uid, user.email])
      .get();

    // Check if any record matches today's date
    const targetDateStr = this.extractDateString(date.toISOString());
    const exists = allRecordsSnapshot.docs.some(doc => {
      const recordDate = doc.data().date;
      const recordDateStr = this.extractDateString(recordDate);
      return recordDateStr === targetDateStr;
    });

    if (exists) {
      this.logger.log(`    ⚠ Daily statistics already exists for today`);
      return;
    }

    await db.collection('dailyStatistics').add({
      userId: user.uid,
      planId: subscription.planId,
      date: date.toISOString(),
      consumed: {
        hydration: 0,
        calories: 0,
        proteins: 0,
        carbohydrates: 0,
        fats: 0,
      },
      burned: {
        calories: 0,
        proteins: 0,
        carbohydrates: 0,
        fats: 0,
        waterLoss: 0,
      },
      net: {
        calories: 0,
        proteins: 0,
        carbohydrates: 0,
        fats: 0,
        hydration: 0,
      },
      planTargets: {
        hydration: plan.dailyHydration || 2.5,
        calories: plan.dailyCalories || 2000,
        proteins: plan.dailyProteins || 120,
        carbohydrates: plan.dailyCarbohydrates || 150,
        fats: plan.dailyFats || 50,
      },
      hoursSlept: 0,
      workoutCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Manual trigger endpoint - can be called via API
  async triggerManualCreation() {
    this.logger.log('Manual trigger for daily records creation');
    await this.createDailyProgressRecords();
    return { message: 'Daily records creation triggered successfully' };
  }
}
