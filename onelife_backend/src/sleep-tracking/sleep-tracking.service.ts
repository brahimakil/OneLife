    import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { DailyStatisticsService } from '../daily-statistics/daily-statistics.service';
import { CreateSleepTrackingDto } from './dto/create-sleep-tracking.dto';

@Injectable()
export class SleepTrackingService {
  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly dailyStatisticsService: DailyStatisticsService,
  ) {}

  async createSleepTracking(createSleepTrackingDto: CreateSleepTrackingDto) {
    const db = this.firebaseAdmin.getFirestore();

    // Check if user already has sleep tracking for this date
    const existingQuery = await db
      .collection('sleepTracking')
      .where('userId', '==', createSleepTrackingDto.userId)
      .where('date', '==', createSleepTrackingDto.date)
      .get();

    if (!existingQuery.empty) {
      throw new BadRequestException('Sleep tracking already exists for this user on this date');
    }

    // Calculate total hours
    const bedTime = new Date(createSleepTrackingDto.bedTime);
    const wakeTime = new Date(createSleepTrackingDto.wakeTime);
    
    if (wakeTime <= bedTime) {
      throw new BadRequestException('Wake time must be after bed time');
    }

    const totalHours = (wakeTime.getTime() - bedTime.getTime()) / (1000 * 60 * 60);
    
    if (totalHours < 0.5 || totalHours > 24) {
      throw new BadRequestException('Total sleep hours must be between 0.5 and 24 hours');
    }

    // Fetch target hours from user's active subscription plan
    const subscriptionsSnapshot = await db
      .collection('subscriptions')
      .where('userId', '==', createSleepTrackingDto.userId)
      .where('isActive', '==', true)
      .get();

    if (subscriptionsSnapshot.empty) {
      throw new NotFoundException('No active subscription found for this user');
    }

    const activeSubscription = subscriptionsSnapshot.docs[0].data();
    const planDoc = await db.collection('plans').doc(activeSubscription.planId).get();

    if (!planDoc.exists) {
      throw new NotFoundException('Plan not found');
    }

    const plan = planDoc.data();
    
    if (!plan) {
      throw new NotFoundException('Plan data not found');
    }
    
    const targetHours = plan.hoursOfSleep;

    // Create sleep tracking document
    const sleepTrackingRef = db.collection('sleepTracking').doc();
    const sleepTracking = {
      sleepId: sleepTrackingRef.id,
      userId: createSleepTrackingDto.userId,
      date: createSleepTrackingDto.date,
      bedTime: createSleepTrackingDto.bedTime,
      wakeTime: createSleepTrackingDto.wakeTime,
      totalHours: parseFloat(totalHours.toFixed(1)),
      sleepQuality: createSleepTrackingDto.sleepQuality,
      notes: createSleepTrackingDto.notes || '',
      targetHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await sleepTrackingRef.set(sleepTracking);

    // Recalculate daily statistics
    await this.dailyStatisticsService.recalculateStatistics(createSleepTrackingDto.userId, createSleepTrackingDto.date);

    return sleepTracking;
  }

  async getAllSleepTracking() {
    const db = this.firebaseAdmin.getFirestore();
    const snapshot = await db.collection('sleepTracking').orderBy('date', 'desc').get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => doc.data());
  }

  async getSleepTrackingByUser(userId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const snapshot = await db
      .collection('sleepTracking')
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => doc.data());
  }

  async getSleepTrackingByUserAndDate(userId: string, date: string) {
    const db = this.firebaseAdmin.getFirestore();
    const snapshot = await db
      .collection('sleepTracking')
      .where('userId', '==', userId)
      .where('date', '==', date)
      .get();

    if (snapshot.empty) {
      throw new NotFoundException('Sleep tracking not found for this user and date');
    }

    return snapshot.docs[0].data();
  }

  async deleteSleepTracking(sleepId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const sleepTrackingRef = db.collection('sleepTracking').doc(sleepId);
    const doc = await sleepTrackingRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Sleep tracking not found');
    }

    await sleepTrackingRef.delete();
    return { message: 'Sleep tracking deleted successfully' };
  }
}
