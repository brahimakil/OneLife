import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { DailyStatisticsService } from '../daily-statistics/daily-statistics.service';
import { CreateWorkoutProgressDto } from './dto/create-workout-progress.dto';
import { UpdateWorkoutProgressDto } from './dto/update-workout-progress.dto';

@Injectable()
export class WorkoutProgressService {
  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly dailyStatisticsService: DailyStatisticsService,
  ) {}

  private getLocalTimeAsUTC(): string {
    // Get current local time components
    const now = new Date();
    // Create a UTC date using local time values
    // This stores local time as if it were UTC
    const localAsUTC = new Date(Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds()
    ));
    return localAsUTC.toISOString();
  }

  private async calculateExerciseNutrition(exercise: any) {
    // If nutrition values are already provided, return as is
    if (exercise.caloriesBurned !== undefined && exercise.caloriesBurned > 0) {
      return exercise;
    }

    // Otherwise, fetch exercise details and calculate
    const db = this.firebaseAdmin.getFirestore();
    const exerciseDoc = await db.collection('exercises').doc(exercise.exerciseId).get();
    
    if (!exerciseDoc.exists) {
      return exercise; // Return as is if exercise not found
    }

    const exerciseData = exerciseDoc.data();
    if (!exerciseData) {
      return exercise;
    }

    const totalRepsPerformed = exercise.repsPerSet.reduce((sum: number, rep: number) => sum + rep, 0);
    const defaultReps = exerciseData.defaultReps || 8;
    const sets = exercise.setsCompleted || 0;

    // Calculate average reps per set performed
    const avgRepsPerSet = sets > 0 ? totalRepsPerformed / sets : 0;
    
    // Calculate nutrition adjustment factor based on reps difference
    // If user does same reps as default: factor = 1
    // If user does more reps: factor > 1, if less: factor < 1
    const repsFactor = avgRepsPerSet / defaultReps;

    // Final calculation: (PerSetValue × NumberOfSets × RepsFactor)
    return {
      ...exercise,
      caloriesBurned: parseFloat((exerciseData.caloriesBurnedPerSet * sets * repsFactor).toFixed(2)),
      proteinBurned: parseFloat((exerciseData.proteinBurnedPerSet * sets * repsFactor).toFixed(2)),
      carbsBurned: parseFloat((exerciseData.carbsBurnedPerSet * sets * repsFactor).toFixed(2)),
      fatsBurned: parseFloat((exerciseData.fatsBurnedPerSet * sets * repsFactor).toFixed(2)),
      waterLoss: parseFloat((exerciseData.waterLossPerSet * sets * repsFactor).toFixed(3)),
    };
  }

  private calculateTotals(exercises: any[]) {
    return exercises.reduce(
      (totals, exercise) => {
        if (exercise.isCompleted) {
          totals.totalCaloriesBurned += exercise.caloriesBurned || 0;
          totals.totalProteinBurned += exercise.proteinBurned || 0;
          totals.totalCarbsBurned += exercise.carbsBurned || 0;
          totals.totalFatsBurned += exercise.fatsBurned || 0;
          totals.totalWaterLoss += exercise.waterLoss || 0;
          totals.completedExercises += 1;
        }
        totals.totalExercises += 1;
        return totals;
      },
      {
        totalCaloriesBurned: 0,
        totalProteinBurned: 0,
        totalCarbsBurned: 0,
        totalFatsBurned: 0,
        totalWaterLoss: 0,
        completedExercises: 0,
        totalExercises: 0,
      }
    );
  }

  async createWorkoutProgress(createDto: CreateWorkoutProgressDto) {
    const db = this.firebaseAdmin.getFirestore();

    // Verify user exists (using email as document ID)
    const userDoc = await db.collection('users').doc(createDto.userId).get();
    if (!userDoc.exists) {
      throw new NotFoundException('User not found');
    }

    // Verify plan exists
    const planDoc = await db.collection('plans').doc(createDto.planId).get();
    if (!planDoc.exists) {
      throw new NotFoundException('Plan not found');
    }

    // Verify routine exists
    const routineDoc = await db.collection('gymRoutines').doc(createDto.routineId).get();
    if (!routineDoc.exists) {
      throw new NotFoundException('Gym routine not found');
    }

    // Convert DTO to plain objects and calculate nutrition for each exercise
    const plainExercises = createDto.exercises.map(ex => {
      const plainEx: any = {
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        isCompleted: ex.isCompleted,
        setsCompleted: ex.setsCompleted,
        repsPerSet: ex.repsPerSet,
        caloriesBurned: ex.caloriesBurned,
        proteinBurned: ex.proteinBurned,
        carbsBurned: ex.carbsBurned,
        fatsBurned: ex.fatsBurned,
        waterLoss: ex.waterLoss,
      };
      
      // Only add optional fields if they have values
      if (ex.completedAt) plainEx.completedAt = ex.completedAt;
      if (ex.notes) plainEx.notes = ex.notes;
      
      return plainEx;
    });

    const processedExercises = await Promise.all(
      plainExercises.map(ex => this.calculateExerciseNutrition(ex))
    );

    // Calculate totals
    const totals = this.calculateTotals(processedExercises);
    const completionPercentage = totals.totalExercises > 0
      ? (totals.completedExercises / totals.totalExercises) * 100
      : 0;

    const progressRef = db.collection('userWorkoutProgress').doc();
    const progressData = {
      progressId: progressRef.id,
      userId: createDto.userId,
      planId: createDto.planId,
      routineId: createDto.routineId,
      date: createDto.date,
      dayOfWeek: createDto.dayOfWeek,
      exercises: processedExercises,
      ...totals,
      completionPercentage: parseFloat(completionPercentage.toFixed(2)),
      isCompleted: createDto.isCompleted !== undefined ? createDto.isCompleted : false,
      markedBy: createDto.markedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await progressRef.set(progressData);

    // Recalculate daily statistics
    await this.dailyStatisticsService.recalculateStatistics(createDto.userId, createDto.date);

    return progressData;
  }

  async getAllWorkoutProgress() {
    const db = this.firebaseAdmin.getFirestore();
    const snapshot = await db.collection('userWorkoutProgress').get();
    return snapshot.docs.map(doc => doc.data());
  }

  async getWorkoutProgressById(progressId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const doc = await db.collection('userWorkoutProgress').doc(progressId).get();

    if (!doc.exists) {
      throw new NotFoundException('Workout progress not found');
    }

    return doc.data();
  }

  async getWorkoutProgressByUserId(userId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const snapshot = await db
      .collection('userWorkoutProgress')
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data());
  }

  async getWorkoutProgressByDate(userId: string, date: string) {
    const db = this.firebaseAdmin.getFirestore();
    const snapshot = await db
      .collection('userWorkoutProgress')
      .where('userId', '==', userId)
      .where('date', '==', date)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  }

  async updateWorkoutProgress(progressId: string, updateDto: UpdateWorkoutProgressDto) {
    const db = this.firebaseAdmin.getFirestore();
    const progressRef = db.collection('userWorkoutProgress').doc(progressId);
    const doc = await progressRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Workout progress not found');
    }

    // If exercises are being updated, recalculate nutrition and totals
    let updateData: any = { ...updateDto };

    if (updateDto.exercises) {
      // Convert DTO to plain objects
      const plainExercises = updateDto.exercises.map(ex => {
        const plainEx: any = {
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          isCompleted: ex.isCompleted,
          setsCompleted: ex.setsCompleted,
          repsPerSet: ex.repsPerSet,
          caloriesBurned: ex.caloriesBurned,
          proteinBurned: ex.proteinBurned,
          carbsBurned: ex.carbsBurned,
          fatsBurned: ex.fatsBurned,
          waterLoss: ex.waterLoss,
        };
        
        // Only add optional fields if they have values
        if (ex.completedAt) plainEx.completedAt = ex.completedAt;
        if (ex.notes) plainEx.notes = ex.notes;
        
        return plainEx;
      });

      // Calculate nutrition for each exercise if not provided
      const processedExercises = await Promise.all(
        plainExercises.map(ex => this.calculateExerciseNutrition(ex))
      );

      const totals = this.calculateTotals(processedExercises);
      const completionPercentage = totals.totalExercises > 0
        ? (totals.completedExercises / totals.totalExercises) * 100
        : 0;

      updateData = {
        ...updateData,
        exercises: processedExercises,
        ...totals,
        completionPercentage: parseFloat(completionPercentage.toFixed(2)),
      };
    }

    updateData.updatedAt = new Date().toISOString();

    await progressRef.update(updateData);

    // Recalculate daily statistics
    const currentData = doc.data();
    if (currentData) {
      await this.dailyStatisticsService.recalculateStatistics(currentData.userId, currentData.date);
    }

    const updatedDoc = await progressRef.get();
    return updatedDoc.data();
  }

  async updateSingleExercise(progressId: string, exerciseId: string, exerciseData: any) {
    const db = this.firebaseAdmin.getFirestore();
    const progressRef = db.collection('userWorkoutProgress').doc(progressId);
    const doc = await progressRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Workout progress not found');
    }

    const progressData = doc.data();
    if (!progressData) {
      throw new NotFoundException('Workout progress data not found');
    }
    
    const exercises = progressData.exercises || [];

    // Find the exercise index
    const exerciseIndex = exercises.findIndex((ex: any) => ex.exerciseId === exerciseId);

    let updatedExercise: any;

    if (exerciseIndex === -1) {
      // Exercise not found - this is a new exercise added to routine
      // Add it to the exercises array
      updatedExercise = {
        exerciseId,
        exerciseName: exerciseData.exerciseName,
        ...exerciseData,
        // Set completedAt timestamp when exercise is saved with data (sets > 0)
        // Use local time stored as UTC to match user's timezone
        completedAt: exerciseData.setsCompleted > 0 ? this.getLocalTimeAsUTC() : null,
      };

      // Calculate nutrition for this exercise
      const processedExercise = await this.calculateExerciseNutrition(updatedExercise);
      exercises.push(processedExercise);
    } else {
      // Update the existing exercise with timestamp when saved
      updatedExercise = {
        ...exercises[exerciseIndex],
        ...exerciseData,
        // Set completedAt timestamp when exercise is saved with data (sets > 0)
        // Preserve existing timestamp if already set and sets remain > 0
        completedAt: exerciseData.setsCompleted > 0 
          ? (exercises[exerciseIndex].completedAt || this.getLocalTimeAsUTC())
          : null,
      };

      // Calculate nutrition for this exercise
      const processedExercise = await this.calculateExerciseNutrition(updatedExercise);
      exercises[exerciseIndex] = processedExercise;
    }

    // Recalculate totals
    const totals = this.calculateTotals(exercises);
    const completionPercentage = totals.totalExercises > 0
      ? (totals.completedExercises / totals.totalExercises) * 100
      : 0;

    // Update the document
    await progressRef.update({
      exercises,
      ...totals,
      completionPercentage: parseFloat(completionPercentage.toFixed(2)),
      isCompleted: totals.completedExercises === totals.totalExercises,
      updatedAt: new Date().toISOString(),
    });

    // Recalculate daily statistics
    await this.dailyStatisticsService.recalculateStatistics(progressData.userId, progressData.date);

    const updatedDoc = await progressRef.get();
    return updatedDoc.data();
  }

  async deleteWorkoutProgress(progressId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const progressRef = db.collection('userWorkoutProgress').doc(progressId);
    const doc = await progressRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Workout progress not found');
    }

    await progressRef.delete();
    return { message: 'Workout progress deleted successfully' };
  }

  async syncRoutineToProgress(
    routineId: string,
    dayOfWeek: string,
    routineExercises: any[],
  ) {
    console.log('=== SYNC ROUTINE TO PROGRESS ===');
    console.log('Routine ID:', routineId);
    console.log('Day of Week:', dayOfWeek);
    console.log('Routine Exercises:', routineExercises.length);

    const db = this.firebaseAdmin.getFirestore();
    
    // Find all workout progress documents that use this routine
    const progressSnapshot = await db
      .collection('userWorkoutProgress')
      .where('routineId', '==', routineId)
      .where('dayOfWeek', '==', dayOfWeek)
      .get();

    console.log('Found progress documents:', progressSnapshot.size);

    if (progressSnapshot.empty) {
      console.log('No progress documents found to update');
      return { 
        message: 'No workout progress found for this routine and day',
        updatedCount: 0 
      };
    }

    let updatedCount = 0;
    const batch = db.batch();

    for (const doc of progressSnapshot.docs) {
      const progressData = doc.data();
      console.log(`Processing progress ${doc.id} for user ${progressData.userId}`);
      const existingExercises = progressData.exercises || [];
      const existingExerciseIds = existingExercises.map((ex: any) => ex.exerciseId);

      console.log(`  Existing exercises: ${existingExerciseIds.join(', ')}`);
      console.log(`  Routine exercises: ${routineExercises.map(ex => ex.exerciseId).join(', ')}`);

      // Find new exercises that need to be added
      const newExercises = routineExercises
        .filter(ex => !existingExerciseIds.includes(ex.exerciseId))
        .map(ex => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          isCompleted: false,
          setsCompleted: 0,
          repsPerSet: [],
          caloriesBurned: 0,
          proteinBurned: 0,
          carbsBurned: 0,
          fatsBurned: 0,
          waterLoss: 0,
          notes: '',
        }));

      console.log(`  New exercises to add: ${newExercises.length}`);
      if (newExercises.length > 0) {
        console.log(`  New exercise IDs: ${newExercises.map(ex => ex.exerciseId).join(', ')}`);
        
        const updatedExercises = [...existingExercises, ...newExercises];
        
        // Recalculate totals
        const totals = this.calculateTotals(updatedExercises);
        const completionPercentage = totals.totalExercises > 0
          ? (totals.completedExercises / totals.totalExercises) * 100
          : 0;

        batch.update(doc.ref, {
          exercises: updatedExercises,
          ...totals,
          completionPercentage: parseFloat(completionPercentage.toFixed(2)),
          isCompleted: totals.completedExercises === totals.totalExercises,
          updatedAt: new Date().toISOString(),
        });

        updatedCount++;
        console.log(`  ✅ Queued update for ${doc.id}`);
      } else {
        console.log(`  ⏭️  No new exercises to add for ${doc.id}`);
      }
    }

    console.log(`Total documents to update: ${updatedCount}`);

    if (updatedCount > 0) {
      console.log('Committing batch update...');
      await batch.commit();
      console.log('✅ Batch committed successfully');
    } else {
      console.log('No updates needed');
    }

    const result = {
      message: `Successfully synced routine to ${updatedCount} workout progress document(s)`,
      updatedCount,
    };

    console.log('Sync result:', result);
    return result;
  }
}

