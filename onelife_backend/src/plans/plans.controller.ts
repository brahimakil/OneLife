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
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  async createPlan(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.createPlan(createPlanDto);
  }

  @Get()
  async getAllPlans() {
    return this.plansService.getAllPlans();
  }

  @Get(':id')
  async getPlanById(@Param('id') id: string) {
    return this.plansService.getPlanById(id);
  }

  @Put(':id')
  async updatePlan(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return this.plansService.updatePlan(id, updatePlanDto);
  }

  @Delete(':id')
  async deletePlan(@Param('id') id: string) {
    return this.plansService.deletePlan(id);
  }
}
