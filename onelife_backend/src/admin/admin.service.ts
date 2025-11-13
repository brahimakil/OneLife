import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private firebaseAdminService: FirebaseAdminService,
    private jwtService: JwtService,
  ) {}

  async register(registerAdminDto: RegisterAdminDto) {
    const { email, password, fullName } = registerAdminDto;
    const firestore = this.firebaseAdminService.getFirestore();

    // Check if admin already exists in Firestore
    const adminRef = firestore.collection('admins').doc(email);
    const adminDoc = await adminRef.get();

    if (adminDoc.exists) {
      throw new ConflictException('Admin already exists');
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

      // Hash password for storing in Firestore
      const hashedPassword = await bcrypt.hash(password, 10);

      // Store admin in Firestore admins collection
      await adminRef.set({
        uid: userRecord.uid,
        email,
        password: hashedPassword,
        fullName,
        role: 'admin',
        createdAt: new Date().toISOString(),
        isActive: true,
      });

      // Generate JWT token
      const payload = { email, uid: userRecord.uid, role: 'admin' };
      const token = this.jwtService.sign(payload);

      return {
        message: 'Admin registered successfully',
        admin: {
          uid: userRecord.uid,
          email,
          fullName,
          role: 'admin',
        },
        token,
      };
    } catch (error) {
      // If Firebase Auth creation fails, clean up
      throw new ConflictException(
        error.message || 'Failed to register admin',
      );
    }
  }

  async login(loginAdminDto: LoginAdminDto) {
    const { email, password } = loginAdminDto;
    const firestore = this.firebaseAdminService.getFirestore();

    // Check if email exists in admins collection
    const adminRef = firestore.collection('admins').doc(email);
    const adminDoc = await adminRef.get();

    if (!adminDoc.exists) {
      throw new UnauthorizedException(
        'Invalid credentials or not authorized as admin',
      );
    }

    const adminData = adminDoc.data();

    if (!adminData) {
      throw new UnauthorizedException('Invalid admin data');
    }

    // Check if admin is active
    if (!adminData.isActive) {
      throw new UnauthorizedException('Admin account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, adminData.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { email, uid: adminData.uid, role: 'admin' };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      admin: {
        uid: adminData.uid,
        email: adminData.email,
        fullName: adminData.fullName,
        role: adminData.role,
      },
      token,
    };
  }

  async verifyAdmin(email: string): Promise<boolean> {
    const firestore = this.firebaseAdminService.getFirestore();
    const adminRef = firestore.collection('admins').doc(email);
    const adminDoc = await adminRef.get();

    return adminDoc.exists && adminDoc.data()?.isActive === true;
  }

  async getAdminProfile(email: string) {
    const firestore = this.firebaseAdminService.getFirestore();
    const adminRef = firestore.collection('admins').doc(email);
    const adminDoc = await adminRef.get();

    if (!adminDoc.exists) {
      throw new NotFoundException('Admin not found');
    }

    const adminData = adminDoc.data();

    if (!adminData) {
      throw new NotFoundException('Admin data not found');
    }

    return {
      uid: adminData.uid,
      email: adminData.email,
      fullName: adminData.fullName,
      role: adminData.role,
      createdAt: adminData.createdAt,
    };
  }
}
