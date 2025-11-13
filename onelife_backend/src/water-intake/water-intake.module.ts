import { Module } from '@nestjs/common';
import { WaterIntakeController } from './water-intake.controller';
import { WaterIntakeService } from './water-intake.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { DailyStatisticsModule } from '../daily-statistics/daily-statistics.module';

@Module({
  imports: [FirebaseModule, DailyStatisticsModule],
  controllers: [WaterIntakeController],
  providers: [WaterIntakeService],
  exports: [WaterIntakeService],
})
export class WaterIntakeModule {}
