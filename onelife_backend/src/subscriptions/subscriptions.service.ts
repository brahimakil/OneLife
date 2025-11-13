import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  async createSubscription(createSubscriptionDto: CreateSubscriptionDto) {
    const db = this.firebaseAdmin.getFirestore();

    // Verify user exists by uid
    const userQuery = await db
      .collection('users')
      .where('uid', '==', createSubscriptionDto.userId)
      .limit(1)
      .get();
      
    if (userQuery.empty) {
      throw new NotFoundException('User not found');
    }

    // Verify plan exists
    const planDoc = await db.collection('plans').doc(createSubscriptionDto.planId).get();
    if (!planDoc.exists) {
      throw new NotFoundException('Plan not found');
    }

    // Check if user already has an active subscription
    const activeSubscriptions = await db
      .collection('subscriptions')
      .where('userId', '==', createSubscriptionDto.userId)
      .where('isActive', '==', true)
      .get();

    if (!activeSubscriptions.empty) {
      throw new ConflictException('User already has an active subscription. Please deactivate the current subscription first.');
    }

    const subscriptionRef = db.collection('subscriptions').doc();
    const subscriptionData = {
      subscriptionId: subscriptionRef.id,
      userId: createSubscriptionDto.userId,
      planId: createSubscriptionDto.planId,
      startDate: createSubscriptionDto.startDate,
      endDate: createSubscriptionDto.endDate,
      isActive: createSubscriptionDto.isActive !== undefined ? createSubscriptionDto.isActive : true,
      renewalCount: createSubscriptionDto.renewalCount || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await subscriptionRef.set(subscriptionData);
    return subscriptionData;
  }

  async getAllSubscriptions() {
    const db = this.firebaseAdmin.getFirestore();
    const snapshot = await db.collection('subscriptions').get();
    return snapshot.docs.map(doc => doc.data());
  }

  async getSubscriptionById(subscriptionId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const doc = await db.collection('subscriptions').doc(subscriptionId).get();

    if (!doc.exists) {
      throw new NotFoundException('Subscription not found');
    }

    return doc.data();
  }

  async getSubscriptionsByUserId(userId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const snapshot = await db
      .collection('subscriptions')
      .where('userId', '==', userId)
      .get();

    return snapshot.docs.map(doc => doc.data());
  }

  async getActiveSubscriptions() {
    const db = this.firebaseAdmin.getFirestore();
    const snapshot = await db
      .collection('subscriptions')
      .where('isActive', '==', true)
      .get();

    return snapshot.docs.map(doc => doc.data());
  }

  async updateSubscription(subscriptionId: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    const db = this.firebaseAdmin.getFirestore();
    const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
    const doc = await subscriptionRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Subscription not found');
    }

    const currentData = doc.data();
    if (!currentData) {
      throw new NotFoundException('Subscription data not found');
    }

    // If trying to activate a subscription, check if user already has an active one
    if (updateSubscriptionDto.isActive === true && currentData.isActive === false) {
      const activeSubscriptions = await db
        .collection('subscriptions')
        .where('userId', '==', currentData.userId)
        .where('isActive', '==', true)
        .get();

      if (!activeSubscriptions.empty) {
        throw new ConflictException('User already has an active subscription. Please deactivate the current subscription first.');
      }
    }

    // Verify user exists if updating userId
    if (updateSubscriptionDto.userId) {
      const userDoc = await db.collection('users').doc(updateSubscriptionDto.userId).get();
      if (!userDoc.exists) {
        throw new NotFoundException('User not found');
      }
    }

    // Verify plan exists if updating planId
    if (updateSubscriptionDto.planId) {
      const planDoc = await db.collection('plans').doc(updateSubscriptionDto.planId).get();
      if (!planDoc.exists) {
        throw new NotFoundException('Plan not found');
      }
    }

    const updateData = {
      ...updateSubscriptionDto,
      updatedAt: new Date().toISOString(),
    };

    await subscriptionRef.update(updateData);

    const updatedDoc = await subscriptionRef.get();
    return updatedDoc.data();
  }

  async deleteSubscription(subscriptionId: string) {
    const db = this.firebaseAdmin.getFirestore();
    const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
    const doc = await subscriptionRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Subscription not found');
    }

    await subscriptionRef.delete();
    return { message: 'Subscription deleted successfully' };
  }
}
