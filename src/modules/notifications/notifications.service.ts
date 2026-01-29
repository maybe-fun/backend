import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserDevice } from 'src/entities/user-device.entity';
import { EntityManager, LessThan, Repository } from 'typeorm';
import {
  GetNotificationsDto,
  RegisterFcmTokenDto,
} from './dto/notifications.dto';
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
    manager?: EntityManager;
  }) {
    const repo = input?.manager
      ? input.manager.getRepository(Notification)
      : this.notificationRepo;
    const notification = await repo.save({
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

  /**
   * Get paginated notifications
   */
  async getNotifications(userId: string, query: GetNotificationsDto) {
    const limit = Math.min(query.limit ?? 20, 50);

    const where: any = { userId };

    if (query.is_read !== undefined) {
      where.isRead = query.is_read === 'true';
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.cursor) {
      const cursorDate = new Date(query.cursor);

      if (Number.isNaN(cursorDate.getTime())) {
        throw new BadRequestException('Invalid cursor format');
      }

      where.createdAt = LessThan(cursorDate);
    }

    const notifications = await this.notificationRepo.find({
      where,
      relations: ['market', 'relatedUser'],
      order: { createdAt: 'DESC' },
      take: limit + 1,
    });

    const hasNextPage = notifications.length > limit;
    const items = notifications.slice(0, limit);

    const nextCursor = hasNextPage
      ? items[items.length - 1].createdAt.toISOString()
      : null;

    const unreadCount = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });

    return {
      notifications: items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        is_read: n.isRead,
        market: n.market
          ? {
              id: n.market.id,
              question: n.market.question,
              imageUrl: n.market.imageUrl,
            }
          : undefined,
        action_url: n.actionUrl,
        created_at: n.createdAt,
      })),
      next_cursor: nextCursor,
      unread_count: unreadCount,
    };
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(userId: string, id: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });

    if (!notification) return null;

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationRepo.save(notification);
    }

    return { notification };
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    const result = await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({
        isRead: true,
        readAt: () => 'NOW()',
      })
      .where('user_id = :userId', { userId })
      .andWhere('is_read = false')
      .execute();

    return {
      updated_count: result.affected ?? 0,
    };
  }
}
