import { Module } from '@nestjs/common';
import { GymRoutinesController } from './gym-routines.controller';
import { GymRoutinesService } from './gym-routines.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [FirebaseModule, AdminModule],
  controllers: [GymRoutinesController],
  providers: [GymRoutinesService],
  exports: [GymRoutinesService],
})
export class GymRoutinesModule {}
