import { Module } from '@nestjs/common';
import { FoodIntakeService } from './food-intake.service';
import { FoodIntakeController } from './food-intake.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { DailyStatisticsModule } from '../daily-statistics/daily-statistics.module';

@Module({
  imports: [FirebaseModule, DailyStatisticsModule],
  providers: [FoodIntakeService],
  controllers: [FoodIntakeController],
})
export class FoodIntakeModule {}
