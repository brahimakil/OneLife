import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { ExercisesModule } from './exercises/exercises.module';
import { GymRoutinesModule } from './gym-routines/gym-routines.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { WorkoutProgressModule } from './workout-progress/workout-progress.module';
import { WaterIntakeModule } from './water-intake/water-intake.module';
import { FoodIntakeModule } from './food-intake/food-intake.module';
import { SleepTrackingModule } from './sleep-tracking/sleep-tracking.module';
import { DailyStatisticsModule } from './daily-statistics/daily-statistics.module';
import { TaskSchedulerModule } from './task-scheduler/task-scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    FirebaseModule,
    AdminModule,
    UsersModule,
    ExercisesModule,
    GymRoutinesModule,
    PlansModule,
    SubscriptionsModule,
    WorkoutProgressModule,
    WaterIntakeModule,
    FoodIntakeModule,
    SleepTrackingModule,
    DailyStatisticsModule,
    TaskSchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
