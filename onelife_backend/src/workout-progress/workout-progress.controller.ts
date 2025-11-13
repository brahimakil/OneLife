import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorkoutProgressService } from './workout-progress.service';
import { CreateWorkoutProgressDto } from './dto/create-workout-progress.dto';
import { UpdateWorkoutProgressDto } from './dto/update-workout-progress.dto';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';

@Controller('workout-progress')
@UseGuards(JwtAuthGuard)
export class WorkoutProgressController {
  constructor(private readonly workoutProgressService: WorkoutProgressService) {}

  @Post()
  async createWorkoutProgress(@Body() createDto: CreateWorkoutProgressDto) {
    return this.workoutProgressService.createWorkoutProgress(createDto);
  }

  @Get()
  async getAllWorkoutProgress() {
    return this.workoutProgressService.getAllWorkoutProgress();
  }

  @Get('user/:userId')
  async getWorkoutProgressByUserId(@Param('userId') userId: string) {
    return this.workoutProgressService.getWorkoutProgressByUserId(userId);
  }

  @Get('user/:userId/date/:date')
  async getWorkoutProgressByDate(
    @Param('userId') userId: string,
    @Param('date') date: string,
  ) {
    return this.workoutProgressService.getWorkoutProgressByDate(userId, date);
  }

  @Get(':id')
  async getWorkoutProgressById(@Param('id') id: string) {
    return this.workoutProgressService.getWorkoutProgressById(id);
  }

  @Put(':id')
  async updateWorkoutProgress(
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkoutProgressDto,
  ) {
    return this.workoutProgressService.updateWorkoutProgress(id, updateDto);
  }

  @Patch(':id/exercise/:exerciseId')
  async updateSingleExercise(
    @Param('id') id: string,
    @Param('exerciseId') exerciseId: string,
    @Body() exerciseData: any,
  ) {
    return this.workoutProgressService.updateSingleExercise(id, exerciseId, exerciseData);
  }

  @Post('sync-routine/:routineId')
  async syncRoutineToProgress(
    @Param('routineId') routineId: string,
    @Body() body: { dayOfWeek: string; exercises: any[] },
  ) {
    return this.workoutProgressService.syncRoutineToProgress(
      routineId,
      body.dayOfWeek,
      body.exercises,
    );
  }

  @Delete(':id')
  async deleteWorkoutProgress(@Param('id') id: string) {
    return this.workoutProgressService.deleteWorkoutProgress(id);
  }
}
