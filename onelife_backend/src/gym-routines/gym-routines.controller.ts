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
import { GymRoutinesService } from './gym-routines.service';
import { CreateGymRoutineDto } from './dto/create-gym-routine.dto';
import { UpdateGymRoutineDto } from './dto/update-gym-routine.dto';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';

@Controller('gym-routines')
@UseGuards(JwtAuthGuard)
export class GymRoutinesController {
  constructor(private readonly gymRoutinesService: GymRoutinesService) {}

  @Post()
  async createRoutine(@Body() createRoutineDto: CreateGymRoutineDto) {
    return this.gymRoutinesService.createRoutine(createRoutineDto);
  }

  @Get()
  async getAllRoutines() {
    return this.gymRoutinesService.getAllRoutines();
  }

  @Get(':id')
  async getRoutineById(@Param('id') id: string) {
    return this.gymRoutinesService.getRoutineById(id);
  }

  @Put(':id')
  async updateRoutine(
    @Param('id') id: string,
    @Body() updateRoutineDto: UpdateGymRoutineDto,
  ) {
    return this.gymRoutinesService.updateRoutine(id, updateRoutineDto);
  }

  @Delete(':id')
  async deleteRoutine(@Param('id') id: string) {
    return this.gymRoutinesService.deleteRoutine(id);
  }
}
