import { Module } from '@nestjs/common';
import { DailyStatisticsService } from './daily-statistics.service';
import { DailyStatisticsController } from './daily-statistics.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [FirebaseModule, AdminModule],
  controllers: [DailyStatisticsController],
  providers: [DailyStatisticsService],
  exports: [DailyStatisticsService],
})
export class DailyStatisticsModule {}
