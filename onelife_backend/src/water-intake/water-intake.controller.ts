import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { WaterIntakeService } from './water-intake.service';
import { CreateWaterIntakeDto } from './dto/create-water-intake.dto';
import { AddWaterLogDto } from './dto/add-water-log.dto';
import { UpdateWaterLogDto } from './dto/update-water-log.dto';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';

@Controller('water-intake')
@UseGuards(JwtAuthGuard)
export class WaterIntakeController {
  constructor(private readonly waterIntakeService: WaterIntakeService) {}

  @Post()
  createWaterIntake(@Body() createDto: CreateWaterIntakeDto) {
    return this.waterIntakeService.createWaterIntake(createDto);
  }

  @Get()
  getAllWaterIntake() {
    return this.waterIntakeService.getAllWaterIntake();
  }

  @Get('user/:userId')
  getWaterIntakeByUser(@Param('userId') userId: string) {
    return this.waterIntakeService.getWaterIntakeByUser(userId);
  }

  @Get('user/:userId/date/:date')
  getWaterIntakeByUserAndDate(
    @Param('userId') userId: string,
    @Param('date') date: string
  ) {
    return this.waterIntakeService.getWaterIntakeByUserAndDate(userId, date);
  }

  @Post(':intakeId/log')
  addWaterLog(
    @Param('intakeId') intakeId: string,
    @Body() addLogDto: AddWaterLogDto
  ) {
    return this.waterIntakeService.addWaterLog(intakeId, addLogDto);
  }

  @Put(':intakeId/log/:logId')
  updateWaterLog(
    @Param('intakeId') intakeId: string,
    @Param('logId') logId: string,
    @Body() updateLogDto: UpdateWaterLogDto
  ) {
    return this.waterIntakeService.updateWaterLog(intakeId, logId, updateLogDto);
  }

  @Delete(':intakeId/log/:logId')
  deleteWaterLog(
    @Param('intakeId') intakeId: string,
    @Param('logId') logId: string
  ) {
    return this.waterIntakeService.deleteWaterLog(intakeId, logId);
  }

  @Delete(':intakeId')
  deleteWaterIntake(@Param('intakeId') intakeId: string) {
    return this.waterIntakeService.deleteWaterIntake(intakeId);
  }
}
