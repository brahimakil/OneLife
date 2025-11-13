import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskSchedulerService } from './task-scheduler.service';
import { TaskSchedulerController } from './task-scheduler.controller';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [ScheduleModule.forRoot(), FirebaseModule],
  controllers: [TaskSchedulerController],
  providers: [TaskSchedulerService],
  exports: [TaskSchedulerService],
})
export class TaskSchedulerModule {}
