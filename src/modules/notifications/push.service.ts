import { UserDevice } from 'src/entities/user-device.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In } from 'typeorm';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import {
  Notification,
  NotificationType,
} from 'src/entities/notification.entity';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  constructor(
    @InjectRepository(UserDevice)
    private deviceRepo: Repository<UserDevice>,
    private userRepo: UserRepository,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private configService: ConfigService,
  ) {}

  private isFirebaseInitialized = false;

  onModuleInit() {
    try {
      const projectId = this.configService.get<string>(
        'services.firebase.projectId',
      );
      const clientEmail = this.configService.get<string>(
        'services.firebase.clientEmail',
      );
      const privateKey = this.configService.get<string>(
        'services.firebase.privateKey',
      );

      if (!projectId || !clientEmail || !privateKey) {
        this.logger.warn(
          'Firebase credentials are missing. Push notifications will be disabled.',
        );
        return;
      }

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
          projectId,
          databaseURL: `https://${projectId}.firebaseio.com`,
        });
        this.isFirebaseInitialized = true;
        this.logger.log('Firebase Admin SDK initialized successfully');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
      this.isFirebaseInitialized = false;
    }
  }

  async subscribeToTopic(fcmToken: string) {
    await admin.messaging().subscribeToTopic([fcmToken], 'announcements');
    return;
  }

  async sendToUser(
    userId: string,
    payload: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ) {
    if (!this.isFirebaseInitialized) {
      this.logger.warn(
        'Firebase is not initialized. Skipping push notification.',
      );
      return;
    }
    const devices = await this.deviceRepo.find({
      where: { userId, isActive: true },
    });

    if (!devices.length) return;

    const tokens = devices.map((d) => d.fcmToken);

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
    });

    await this.handleFailures(devices, response);
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      message: 'Push notification sent to user devices',
    };
  }

  async sendAnnouncement(payload: {
    title: string;
    body: string;
    actionUrl?: string;
  }) {
    const { title, body, actionUrl } = payload;

    const users = await this.userRepo.find({
      select: ['id'],
    });

    if (!users.length) return;

    await this.notificationRepo.insert(
      users.map((u) => ({
        userId: u.id,
        type: NotificationType.SYSTEM,
        title,
        body,
        actionUrl,
      })),
    );

    await admin.messaging().send({
      topic: 'announcements',
      notification: {
        title,
        body,
      },
      data: {
        type: NotificationType.SYSTEM,
        actionUrl: actionUrl ?? '',
      },
    });
    return { message: 'Announcement sent to all users' };
  }

  private async handleFailures(
    devices: UserDevice[],
    response: admin.messaging.BatchResponse,
  ) {
    const toDisable: string[] = [];

    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const code = res.error?.code;

        // Invalid or expired token
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          toDisable.push(devices[idx].fcmToken);
        }
      }
    });

    if (toDisable.length) {
      await this.deviceRepo.update(
        { fcmToken: In(toDisable) },
        { isActive: false },
      );
    }
  }
}
