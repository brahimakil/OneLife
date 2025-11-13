import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private firebaseAdminService: FirebaseAdminService) {}

  async createUser(createUserDto: CreateUserDto) {
    const { email, password, fullName, dob, weight, height } = createUserDto;
    const firestore = this.firebaseAdminService.getFirestore();

    // Check if user already exists
    const userRef = firestore.collection('users').doc(email);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      throw new ConflictException('User with this email already exists');
    }

    try {
      // Create user in Firebase Authentication
      const userRecord = await this.firebaseAdminService
        .getAuth()
        .createUser({
          email,
          password,
          displayName: fullName,
        });

      // Hash password for Firestore
      const hashedPassword = await bcrypt.hash(password, 10);

      // Store user in Firestore users collection
      const userData = {
        uid: userRecord.uid,
        email,
        password: hashedPassword,
        fullName,
        dob,
        weight,
        height,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await userRef.set(userData);

      // Return user without password
      const { password: _, ...userWithoutPassword } = userData;
      return {
        message: 'User created successfully',
        user: userWithoutPassword,
      };
    } catch (error) {
      throw new ConflictException(
        error.message || 'Failed to create user',
      );
    }
  }

  async getAllUsers() {
    const firestore = this.firebaseAdminService.getFirestore();
    const usersSnapshot = await firestore.collection('users').get();

    const users: any[] = [];
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      // Exclude password from response
      const { password, ...userWithoutPassword } = userData;
      users.push({
        id: doc.id,
        ...userWithoutPassword,
      });
    });

    return users;
  }

  async getUserByUid(uid: string) {
    const firestore = this.firebaseAdminService.getFirestore();
    const usersSnapshot = await firestore
      .collection('users')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      throw new NotFoundException('User not found');
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const { password, ...userWithoutPassword } = userData;

    return {
      id: userDoc.id,
      ...userWithoutPassword,
    };
  }

  async getUserByEmail(email: string) {
    const firestore = this.firebaseAdminService.getFirestore();
    const userRef = firestore.collection('users').doc(email);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new NotFoundException('User not found');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new NotFoundException('User data not found');
    }

    // Exclude password from response
    const { password, ...userWithoutPassword } = userData;
    return {
      id: userDoc.id,
      ...userWithoutPassword,
    };
  }

  async updateUser(email: string, updateUserDto: UpdateUserDto) {
    const firestore = this.firebaseAdminService.getFirestore();
    const userRef = firestore.collection('users').doc(email);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new NotFoundException('User not found');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new NotFoundException('User data not found');
    }

    try {
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      // Only add fields that are defined
      if (updateUserDto.fullName !== undefined) {
        updateData.fullName = updateUserDto.fullName;
      }
      if (updateUserDto.dob !== undefined) {
        updateData.dob = updateUserDto.dob;
      }
      if (updateUserDto.weight !== undefined) {
        updateData.weight = updateUserDto.weight;
      }
      if (updateUserDto.height !== undefined) {
        updateData.height = updateUserDto.height;
      }

      // If password is being updated, hash it and update in Firebase Auth
      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
        
        // Update Firebase Auth
        await this.firebaseAdminService.getAuth().updateUser(userData.uid, {
          password: updateUserDto.password,
        });
      }

      // Update display name in Firebase Auth if fullName is updated
      if (updateUserDto.fullName) {
        await this.firebaseAdminService.getAuth().updateUser(userData.uid, {
          displayName: updateUserDto.fullName,
        });
      }

      // Update email in Firebase Auth if email is updated
      if (updateUserDto.email && updateUserDto.email !== email) {
        await this.firebaseAdminService.getAuth().updateUser(userData.uid, {
          email: updateUserDto.email,
        });

        // Move document to new email key
        const newUserRef = firestore.collection('users').doc(updateUserDto.email);
        await newUserRef.set({ ...userData, ...updateData });
        await userRef.delete();

        const { password, ...userWithoutPassword } = { ...userData, ...updateData };
        return {
          message: 'User updated successfully',
          user: {
            id: updateUserDto.email,
            ...userWithoutPassword,
          },
        };
      }

      // Update Firestore
      await userRef.update(updateData);

      const updatedUserDoc = await userRef.get();
      const updatedUserData = updatedUserDoc.data();
      
      if (!updatedUserData) {
        throw new NotFoundException('Updated user data not found');
      }

      const { password, ...userWithoutPassword } = updatedUserData;
      return {
        message: 'User updated successfully',
        user: {
          id: email,
          ...userWithoutPassword,
        },
      };
    } catch (error) {
      throw new ConflictException(
        error.message || 'Failed to update user',
      );
    }
  }

  async deleteUser(email: string) {
    const firestore = this.firebaseAdminService.getFirestore();
    const userRef = firestore.collection('users').doc(email);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new NotFoundException('User not found');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new NotFoundException('User data not found');
    }

    try {
      // Delete from Firebase Auth
      await this.firebaseAdminService.getAuth().deleteUser(userData.uid);

      // Delete from Firestore
      await userRef.delete();

      return {
        message: 'User deleted successfully',
      };
    } catch (error) {
      throw new ConflictException(
        error.message || 'Failed to delete user',
      );
    }
  }
}
