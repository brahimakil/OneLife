import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { DailyStatisticsService } from './daily-statistics.service';
import { CreateDailyStatisticDto } from './dto/create-daily-statistic.dto';
import { UpdateDailyStatisticDto } from './dto/update-daily-statistic.dto';

@Controller('daily-statistics')
export class DailyStatisticsController {
  constructor(private readonly dailyStatisticsService: DailyStatisticsService) {}

  @Post()
  create(@Body() createDailyStatisticDto: CreateDailyStatisticDto) {
    return this.dailyStatisticsService.create(createDailyStatisticDto);
  }

  @Get()
  findAll() {
    return this.dailyStatisticsService.findAll();
  }

  @Get('summary')
  getStatisticsSummary(@Query('userId') userId?: string) {
    return this.dailyStatisticsService.getStatisticsSummary(userId);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.dailyStatisticsService.findByUserId(userId);
  }

  @Get('user/:userId/date/:date')
  findByUserIdAndDate(
    @Param('userId') userId: string,
    @Param('date') date: string,
  ) {
    return this.dailyStatisticsService.findByUserIdAndDate(userId, date);
  }

  @Get('date-range')
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('userId') userId?: string,
  ) {
    return this.dailyStatisticsService.findByDateRange(startDate, endDate, userId);
  }

  @Get(':statId')
  findOne(@Param('statId') statId: string) {
    return this.dailyStatisticsService.findOne(statId);
  }

  @Patch(':statId')
  update(
    @Param('statId') statId: string,
    @Body() updateDailyStatisticDto: UpdateDailyStatisticDto,
  ) {
    return this.dailyStatisticsService.update(statId, updateDailyStatisticDto);
  }

  @Delete(':statId')
  remove(@Param('statId') statId: string) {
    return this.dailyStatisticsService.remove(statId);
  }
}
