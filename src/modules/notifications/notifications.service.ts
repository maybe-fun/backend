import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserDevice } from 'src/entities/user-device.entity';
import { Repository } from 'typeorm';
import { RegisterFcmTokenDto } from './dto/notifications.dto';
import { PushService } from './push.service';
import {
  Notification,
  NotificationType,
} from 'src/entities/notification.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRepository } from '../user/user.repository';
import { NotificationEventType } from './events-types';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(UserDevice)
    private deviceRepo: Repository<UserDevice>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private userRepo: UserRepository,
    private pushService: PushService,
    private eventEmitter: EventEmitter2,
  ) {}

  async registerDevice(userId: string, dto: RegisterFcmTokenDto) {
    const existing = await this.deviceRepo.findOne({
      where: { fcmToken: dto.fcm_token },
    });

    if (existing) {
      existing.userId = userId;
      existing.isActive = true;
      existing.userAgent = dto.userAgent;
      existing.ipAddress = dto.ipAddress;
      await this.deviceRepo.save(existing);

      return { success: true, message: 'User device updated' };
    }

    const device = this.deviceRepo.create({
      userId,
      fcmToken: dto.fcm_token,
      isActive: true,
      userAgent: dto.userAgent,
      ipAddress: dto.ipAddress,
    });

    await this.deviceRepo.save(device);
    await this.pushService.subscribeToTopic(dto.fcm_token);

    return { success: true, message: 'User device registered' };
  }

  async create(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    context?: Record<string, any>;
    marketId?: string;
    relatedUserId?: string;
    actionUrl?: string;
  }) {
    const notification = await this.notificationRepo.save({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      marketId: input.marketId,
      relatedUserId: input.relatedUserId,
      actionUrl: input.actionUrl,
    });

    const user = await this.userRepo.findOne({ where: { id: input.userId } });
    if (user) {
      //   await this.emailQueue.enqueue({
      //     userId: input.userId,
      //     template: input.type,
      //     context: input.context,
      //   });
    }

    this.eventEmitter.emitAsync(
      NotificationEventType.NotificationCreated,
      notification,
    );

    return notification;
  }
}
