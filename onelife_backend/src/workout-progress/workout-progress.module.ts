import { Module } from '@nestjs/common';
import { WorkoutProgressController } from './workout-progress.controller';
import { WorkoutProgressService } from './workout-progress.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { AdminModule } from '../admin/admin.module';
import { DailyStatisticsModule } from '../daily-statistics/daily-statistics.module';

@Module({
  imports: [FirebaseModule, AdminModule, DailyStatisticsModule],
  controllers: [WorkoutProgressController],
  providers: [WorkoutProgressService],
  exports: [WorkoutProgressService],
})
export class WorkoutProgressModule {}
