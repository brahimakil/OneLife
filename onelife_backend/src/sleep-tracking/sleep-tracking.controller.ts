import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SleepTrackingService } from './sleep-tracking.service';
import { CreateSleepTrackingDto } from './dto/create-sleep-tracking.dto';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';

@Controller('sleep-tracking')
@UseGuards(JwtAuthGuard)
export class SleepTrackingController {
  constructor(private readonly sleepTrackingService: SleepTrackingService) {}

  @Post()
  create(@Body() createSleepTrackingDto: CreateSleepTrackingDto) {
    return this.sleepTrackingService.createSleepTracking(createSleepTrackingDto);
  }

  @Get()
  findAll() {
    return this.sleepTrackingService.getAllSleepTracking();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.sleepTrackingService.getSleepTrackingByUser(userId);
  }

  @Get('user/:userId/date/:date')
  findByUserAndDate(@Param('userId') userId: string, @Param('date') date: string) {
    return this.sleepTrackingService.getSleepTrackingByUserAndDate(userId, date);
  }

  @Delete(':sleepId')
  remove(@Param('sleepId') sleepId: string) {
    return this.sleepTrackingService.deleteSleepTracking(sleepId);
  }
}
