import { CreateDailyStatisticDto } from './create-daily-statistic.dto';

export class UpdateDailyStatisticDto {
  userId?: string;
  planId?: string;
  date?: Date;
  consumed?: {
    hydration?: number;
    calories?: number;
    proteins?: number;
    carbohydrates?: number;
    fats?: number;
  };
  burned?: {
    calories?: number;
    proteins?: number;
    carbohydrates?: number;
    fats?: number;
    waterLoss?: number;
  };
  net?: {
    calories?: number;
    proteins?: number;
    carbohydrates?: number;
    fats?: number;
    hydration?: number;
  };
  planTargets?: {
    hydration?: number;
    calories?: number;
    proteins?: number;
    carbohydrates?: number;
    fats?: number;
  };
  hoursSlept?: number;
  workoutCompleted?: boolean;
}
