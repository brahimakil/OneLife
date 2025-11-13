import { Controller, Post } from '@nestjs/common';
import { TaskSchedulerService } from './task-scheduler.service';

@Controller('task-scheduler')
export class TaskSchedulerController {
  constructor(private readonly taskSchedulerService: TaskSchedulerService) {}

  @Post('trigger-daily-creation')
  async triggerDailyCreation() {
    return this.taskSchedulerService.triggerManualCreation();
  }
}
