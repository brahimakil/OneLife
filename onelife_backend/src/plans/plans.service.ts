import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  async createPlan(createPlanDto: CreatePlanDto) {
    const db = this.firebaseAdmin.getFirestore();

    // Check if plan name already exists
    const existingPlans = await db
      .collection('plans')
      .where('planName', '==', createPlanDto.planName)
      .get();

    if (!existingPlans.empty) {
      throw new BadRequestException('A plan with this name already exists');
    }

    // Verify gym routine exists
    const routineDoc = await db.collection('gymRoutines').doc(createPlanDto.gymRoutineId).get();
    if (!routineDoc.exists) {
      throw new NotFoundException('Gym routine not found');
    }

    const planRef = db.collection('plans').doc();
    const planData = {
      planId: planRef.id,
      planName: createPlanDto.planName,
      description: createPlanDto.description,
      dailyHydration: createPlanDto.dailyHydration,
      dailyCalories: createPlanDto.dailyCalories,
      dailyProteins: createPlanDto.dailyProteins,
      dailyCarbohydrates: createPlanDto.dailyCarbohydrates,
      dailyFats: createPlanDto.dailyFats,
      hoursOfSleep: createPlanDto.hoursOfSleep,
      gymRoutineId: createPlanDto.gymRoutineId,
      durationDays: createPlanDto.durationDays || 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await planRef.set(planData);
    return planData;
  }

  async getAllPlans() {
    const db = this.firebaseAdmin.getFirestore();
    const snapshot = await db.collection('plans').get();
    return snapshot.docs.map(doc => doc.data());
  }

  async getPlanById(planId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const doc = await db.collection('plans').doc(planId).get();

    if (!doc.exists) {
      throw new NotFoundException('Plan not found');
    }

    return doc.data();
  }

  async updatePlan(planId: string, updatePlanDto: UpdatePlanDto) {
    const db = this.firebaseAdmin.getFirestore();
    const planRef = db.collection('plans').doc(planId);
    const doc = await planRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Plan not found');
    }

    // Check if updating plan name and if it conflicts
    if (updatePlanDto.planName) {
      const existingPlans = await db
        .collection('plans')
        .where('planName', '==', updatePlanDto.planName)
        .get();

      if (!existingPlans.empty && existingPlans.docs[0].id !== planId) {
        throw new BadRequestException('A plan with this name already exists');
      }
    }

    // Verify gym routine exists if updating
    if (updatePlanDto.gymRoutineId) {
      const routineDoc = await db.collection('gymRoutines').doc(updatePlanDto.gymRoutineId).get();
      if (!routineDoc.exists) {
        throw new NotFoundException('Gym routine not found');
      }
    }

    const updateData = {
      ...updatePlanDto,
      updatedAt: new Date().toISOString(),
    };

    await planRef.update(updateData);

    const updatedDoc = await planRef.get();
    return updatedDoc.data();
  }

  async deletePlan(planId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const planRef = db.collection('plans').doc(planId);
    const doc = await planRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Plan not found');
    }

    await planRef.delete();
    return { message: 'Plan deleted successfully' };
  }
}
