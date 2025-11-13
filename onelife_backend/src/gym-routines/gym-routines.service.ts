import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { CreateGymRoutineDto } from './dto/create-gym-routine.dto';
import { UpdateGymRoutineDto } from './dto/update-gym-routine.dto';

@Injectable()
export class GymRoutinesService {
  constructor(private firebaseAdminService: FirebaseAdminService) {}

  async createRoutine(createRoutineDto: CreateGymRoutineDto) {
    const firestore = this.firebaseAdminService.getFirestore();

    try {
      // Check for duplicate routine name
      const existingRoutines = await firestore
        .collection('gymRoutines')
        .where('routineName', '==', createRoutineDto.routineName)
        .get();

      if (!existingRoutines.empty) {
        throw new ConflictException(
          `Routine "${createRoutineDto.routineName}" already exists`,
        );
      }

      const routineData: any = {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Only add fields that are defined
      Object.keys(createRoutineDto).forEach((key) => {
        if (createRoutineDto[key] !== undefined) {
          routineData[key] = createRoutineDto[key];
        }
      });

      const docRef = await firestore.collection('gymRoutines').add(routineData);

      return {
        message: 'Routine created successfully',
        routine: {
          routineId: docRef.id,
          ...routineData,
        },
      };
    } catch (error) {
      throw new ConflictException(
        error.message || 'Failed to create routine',
      );
    }
  }

  async getAllRoutines() {
    const firestore = this.firebaseAdminService.getFirestore();
    const routinesSnapshot = await firestore.collection('gymRoutines').get();

    const routines: any[] = [];
    routinesSnapshot.forEach((doc) => {
      routines.push({
        routineId: doc.id,
        ...doc.data(),
      });
    });

    return routines;
  }

  async getRoutineById(routineId: string) {
    const firestore = this.firebaseAdminService.getFirestore();
    const routineDoc = await firestore
      .collection('gymRoutines')
      .doc(routineId)
      .get();

    if (!routineDoc.exists) {
      throw new NotFoundException('Routine not found');
    }

    return {
      routineId: routineDoc.id,
      ...routineDoc.data(),
    };
  }

  async updateRoutine(
    routineId: string,
    updateRoutineDto: UpdateGymRoutineDto,
  ) {
    const firestore = this.firebaseAdminService.getFirestore();
    const routineRef = firestore.collection('gymRoutines').doc(routineId);
    const routineDoc = await routineRef.get();

    if (!routineDoc.exists) {
      throw new NotFoundException('Routine not found');
    }

    try {
      // Check for duplicate routine name if being updated
      if (updateRoutineDto.routineName) {
        const currentData: any = routineDoc.data();
        const newName = updateRoutineDto.routineName;

        if (newName !== currentData?.routineName) {
          const duplicates = await firestore
            .collection('gymRoutines')
            .where('routineName', '==', newName)
            .get();

          const hasDuplicate = duplicates.docs.some(doc => doc.id !== routineId);
          
          if (hasDuplicate) {
            throw new ConflictException(
              `Routine "${newName}" already exists`,
            );
          }
        }
      }

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      // Only add fields that are defined
      Object.keys(updateRoutineDto).forEach((key) => {
        if (updateRoutineDto[key] !== undefined) {
          updateData[key] = updateRoutineDto[key];
        }
      });

      await routineRef.update(updateData);

      const updatedDoc = await routineRef.get();

      return {
        message: 'Routine updated successfully',
        routine: {
          routineId: updatedDoc.id,
          ...updatedDoc.data(),
        },
      };
    } catch (error) {
      throw new ConflictException(
        error.message || 'Failed to update routine',
      );
    }
  }

  async deleteRoutine(routineId: string) {
    const firestore = this.firebaseAdminService.getFirestore();
    const routineRef = firestore.collection('gymRoutines').doc(routineId);
    const routineDoc = await routineRef.get();

    if (!routineDoc.exists) {
      throw new NotFoundException('Routine not found');
    }

    try {
      await routineRef.delete();

      return {
        message: 'Routine deleted successfully',
      };
    } catch (error) {
      throw new ConflictException(
        error.message || 'Failed to delete routine',
      );
    }
  }
}
