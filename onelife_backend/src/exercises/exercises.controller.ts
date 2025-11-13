import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';

@Controller('exercises')
@UseGuards(JwtAuthGuard)
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post()
  createExercise(@Body() createExerciseDto: CreateExerciseDto) {
    return this.exercisesService.createExercise(createExerciseDto);
  }

  @Get()
  getAllExercises() {
    return this.exercisesService.getAllExercises();
  }

  @Get(':id')
  getExerciseById(@Param('id') id: string) {
    return this.exercisesService.getExerciseById(id);
  }

  @Put(':id')
  updateExercise(
    @Param('id') id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
  ) {
    return this.exercisesService.updateExercise(id, updateExerciseDto);
  }

  @Delete(':id')
  deleteExercise(@Param('id') id: string) {
    return this.exercisesService.deleteExercise(id);
  }
}
