import { Module } from '@nestjs/common';
import { SleepTrackingService } from './sleep-tracking.service';
import { SleepTrackingController } from './sleep-tracking.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { DailyStatisticsModule } from '../daily-statistics/daily-statistics.module';

@Module({
  imports: [FirebaseModule, DailyStatisticsModule],
  providers: [SleepTrackingService],
  controllers: [SleepTrackingController]
})
export class SleepTrackingModule {}
