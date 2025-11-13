import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { DailyStatisticsService } from '../daily-statistics/daily-statistics.service';
import { CreateWaterIntakeDto } from './dto/create-water-intake.dto';
import { AddWaterLogDto } from './dto/add-water-log.dto';
import { UpdateWaterLogDto } from './dto/update-water-log.dto';

@Injectable()
export class WaterIntakeService {
  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly dailyStatisticsService: DailyStatisticsService,
  ) {}

  async createWaterIntake(createDto: CreateWaterIntakeDto) {
    const db = this.firebaseAdmin.getFirestore();
    
    // Check if intake already exists for this user and date
    const dateStr = new Date(createDto.date).toISOString().split('T')[0];
    const existingQuery = await db.collection('waterIntake')
      .where('userId', '==', createDto.userId)
      .where('date', '>=', dateStr + 'T00:00:00Z')
      .where('date', '<=', dateStr + 'T23:59:59Z')
      .get();

    if (!existingQuery.empty) {
      throw new ConflictException('Water intake already exists for this date');
    }

    // Calculate total consumed
    const totalConsumed = createDto.logs.reduce((sum, log) => sum + log.amount, 0);

    const intakeRef = db.collection('waterIntake').doc();
    const intakeData = {
      intakeId: intakeRef.id,
      userId: createDto.userId,
      date: createDto.date,
      logs: createDto.logs,
      totalConsumed: parseFloat(totalConsumed.toFixed(3)),
      dailyTarget: createDto.dailyTarget,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await intakeRef.set(intakeData);
    return intakeData;
  }

  async getAllWaterIntake() {
    const db = this.firebaseAdmin.getFirestore();
    const snapshot = await db.collection('waterIntake').orderBy('date', 'desc').get();
    
    return snapshot.docs.map(doc => ({
      intakeId: doc.id,
      ...doc.data()
    }));
  }

  async getWaterIntakeByUser(userId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const snapshot = await db.collection('waterIntake')
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      intakeId: doc.id,
      ...doc.data()
    }));
  }

  async getWaterIntakeByUserAndDate(userId: string, date: string) {
    const db = this.firebaseAdmin.getFirestore();
    const dateStr = new Date(date).toISOString().split('T')[0];
    
    const snapshot = await db.collection('waterIntake')
      .where('userId', '==', userId)
      .where('date', '>=', dateStr + 'T00:00:00Z')
      .where('date', '<=', dateStr + 'T23:59:59Z')
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      intakeId: doc.id,
      ...doc.data()
    };
  }

  async addWaterLog(intakeId: string, addLogDto: AddWaterLogDto) {
    const db = this.firebaseAdmin.getFirestore();
    const intakeRef = db.collection('waterIntake').doc(intakeId);
    const doc = await intakeRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Water intake not found');
    }

    const intakeData = doc.data();
    if (!intakeData) {
      throw new NotFoundException('Water intake data not found');
    }

    const logs = intakeData.logs || [];

    // Generate log ID
    const logId = `log${Date.now()}`;
    const newLog = {
      logId,
      amount: addLogDto.amount,
      timestamp: addLogDto.timestamp || new Date().toISOString(),
      note: addLogDto.note || '',
    };

    logs.push(newLog);

    // Recalculate total
    const totalConsumed = logs.reduce((sum, log) => sum + log.amount, 0);

    await intakeRef.update({
      logs,
      totalConsumed: parseFloat(totalConsumed.toFixed(3)),
      updatedAt: new Date().toISOString(),
    });

    // Recalculate daily statistics
    console.log('💧 Calling recalculateStatistics for water intake:', intakeData.userId, intakeData.date);
    await this.dailyStatisticsService.recalculateStatistics(intakeData.userId, intakeData.date);

    const updatedDoc = await intakeRef.get();
    return {
      intakeId: updatedDoc.id,
      ...updatedDoc.data()
    };
  }

  async updateWaterLog(intakeId: string, logId: string, updateLogDto: UpdateWaterLogDto) {
    const db = this.firebaseAdmin.getFirestore();
    const intakeRef = db.collection('waterIntake').doc(intakeId);
    const doc = await intakeRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Water intake not found');
    }

    const intakeData = doc.data();
    if (!intakeData) {
      throw new NotFoundException('Water intake data not found');
    }

    const logs = intakeData.logs || [];

    const logIndex = logs.findIndex(log => log.logId === logId);
    if (logIndex === -1) {
      throw new NotFoundException('Water log not found');
    }

    // Update log
    logs[logIndex] = {
      ...logs[logIndex],
      ...updateLogDto,
    };

    // Recalculate total
    const totalConsumed = logs.reduce((sum, log) => sum + log.amount, 0);

    await intakeRef.update({
      logs,
      totalConsumed: parseFloat(totalConsumed.toFixed(3)),
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await intakeRef.get();
    return {
      intakeId: updatedDoc.id,
      ...updatedDoc.data()
    };
  }

  async deleteWaterLog(intakeId: string, logId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const intakeRef = db.collection('waterIntake').doc(intakeId);
    const doc = await intakeRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Water intake not found');
    }

    const intakeData = doc.data();
    if (!intakeData) {
      throw new NotFoundException('Water intake data not found');
    }

    const logs = intakeData.logs || [];

    const filteredLogs = logs.filter(log => log.logId !== logId);

    if (filteredLogs.length === logs.length) {
      throw new NotFoundException('Water log not found');
    }

    // Recalculate total
    const totalConsumed = filteredLogs.reduce((sum, log) => sum + log.amount, 0);

    await intakeRef.update({
      logs: filteredLogs,
      totalConsumed: parseFloat(totalConsumed.toFixed(3)),
      updatedAt: new Date().toISOString(),
    });

    // Recalculate daily statistics
    await this.dailyStatisticsService.recalculateStatistics(intakeData.userId, intakeData.date);

    const updated = await intakeRef.get();
    return {
      ...updated.data(),
      intakeId: updated.data()?.intakeId || intakeId,
    };
  }

  async deleteWaterIntake(intakeId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const intakeRef = db.collection('waterIntake').doc(intakeId);
    const doc = await intakeRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Water intake not found');
    }

    await intakeRef.delete();
    return { message: 'Water intake deleted successfully' };
  }
}
