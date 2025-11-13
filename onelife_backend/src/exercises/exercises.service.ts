import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(private firebaseAdminService: FirebaseAdminService) {}

  async createExercise(createExerciseDto: CreateExerciseDto) {
    const firestore = this.firebaseAdminService.getFirestore();

    try {
      // Check for duplicate exercise (same name + category + muscle group + difficulty)
      const existingExercises = await firestore
        .collection('exercises')
        .where('exerciseName', '==', createExerciseDto.exerciseName)
        .where('category', '==', createExerciseDto.category)
        .where('muscleGroup', '==', createExerciseDto.muscleGroup)
        .where('difficulty', '==', createExerciseDto.difficulty)
        .get();

      if (!existingExercises.empty) {
        throw new ConflictException(
          `Exercise "${createExerciseDto.exerciseName}" with category "${createExerciseDto.category}", muscle group "${createExerciseDto.muscleGroup}", and difficulty "${createExerciseDto.difficulty}" already exists`,
        );
      }

      // Filter out undefined values to avoid Firestore errors
      const exerciseData: any = {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Only add fields that are defined
      Object.keys(createExerciseDto).forEach((key) => {
        if (createExerciseDto[key] !== undefined) {
          exerciseData[key] = createExerciseDto[key];
        }
      });

      const docRef = await firestore.collection('exercises').add(exerciseData);

      return {
        message: 'Exercise created successfully',
        exercise: {
          exerciseId: docRef.id,
          ...exerciseData,
        },
      };
    } catch (error) {
      throw new ConflictException(
        error.message || 'Failed to create exercise',
      );
    }
  }

  async getAllExercises() {
    const firestore = this.firebaseAdminService.getFirestore();
    const exercisesSnapshot = await firestore.collection('exercises').get();

    const exercises: any[] = [];
    exercisesSnapshot.forEach((doc) => {
      exercises.push({
        exerciseId: doc.id,
        ...doc.data(),
      });
    });

    return exercises;
  }

  async getExerciseById(exerciseId: string) {
    const firestore = this.firebaseAdminService.getFirestore();
    const exerciseDoc = await firestore
      .collection('exercises')
      .doc(exerciseId)
      .get();

    if (!exerciseDoc.exists) {
      throw new NotFoundException('Exercise not found');
    }

    return {
      exerciseId: exerciseDoc.id,
      ...exerciseDoc.data(),
    };
  }

  async updateExercise(
    exerciseId: string,
    updateExerciseDto: UpdateExerciseDto,
  ) {
    const firestore = this.firebaseAdminService.getFirestore();
    const exerciseRef = firestore.collection('exercises').doc(exerciseId);
    const exerciseDoc = await exerciseRef.get();

    if (!exerciseDoc.exists) {
      throw new NotFoundException('Exercise not found');
    }

    try {
      // Check for duplicate if any of the key fields are being updated
      if (updateExerciseDto.exerciseName || updateExerciseDto.category || 
          updateExerciseDto.muscleGroup || updateExerciseDto.difficulty) {
        const currentData: any = exerciseDoc.data();
        const newName = updateExerciseDto.exerciseName || currentData?.exerciseName;
        const newCategory = updateExerciseDto.category || currentData?.category;
        const newMuscleGroup = updateExerciseDto.muscleGroup || currentData?.muscleGroup;
        const newDifficulty = updateExerciseDto.difficulty || currentData?.difficulty;

        // Check if another exercise has the same combination
        const duplicates = await firestore
          .collection('exercises')
          .where('exerciseName', '==', newName)
          .where('category', '==', newCategory)
          .where('muscleGroup', '==', newMuscleGroup)
          .where('difficulty', '==', newDifficulty)
          .get();

        // Check if any duplicate is not the current exercise
        const hasDuplicate = duplicates.docs.some(doc => doc.id !== exerciseId);
        
        if (hasDuplicate) {
          throw new ConflictException(
            `Exercise "${newName}" with category "${newCategory}", muscle group "${newMuscleGroup}", and difficulty "${newDifficulty}" already exists`,
          );
        }
      }

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      // Only add fields that are defined
      Object.keys(updateExerciseDto).forEach((key) => {
        if (updateExerciseDto[key] !== undefined) {
          updateData[key] = updateExerciseDto[key];
        }
      });

      await exerciseRef.update(updateData);

      const updatedDoc = await exerciseRef.get();

      return {
        message: 'Exercise updated successfully',
        exercise: {
          exerciseId: updatedDoc.id,
          ...updatedDoc.data(),
        },
      };
    } catch (error) {
      throw new ConflictException(
        error.message || 'Failed to update exercise',
      );
    }
  }

  async deleteExercise(exerciseId: string) {
    const firestore = this.firebaseAdminService.getFirestore();
    const exerciseRef = firestore.collection('exercises').doc(exerciseId);
    const exerciseDoc = await exerciseRef.get();

    if (!exerciseDoc.exists) {
      throw new NotFoundException('Exercise not found');
    }

    try {
      await exerciseRef.delete();

      return {
        message: 'Exercise deleted successfully',
      };
    } catch (error) {
      throw new ConflictException(
        error.message || 'Failed to delete exercise',
      );
    }
  }
}
