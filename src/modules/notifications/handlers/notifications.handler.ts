import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from 'src/entities/notification.entity';
import { PushService } from '../push.service';
import { NotificationEventType } from '../events-types';

@Injectable()
export class NotificationHandlerService {
  private readonly logger = new Logger(NotificationHandlerService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly pushService: PushService,
  ) {}

  @OnEvent(NotificationEventType.NotificationCreated, { async: true })
  async handleCreated(event: Notification) {
    const notification = await this.notificationRepo.findOne({
      where: { id: event.id },
      relations: ['market'],
    });

    if (!notification) {
      this.logger.warn(`Notification ${event.id} not found (created event)`);
      return;
    }

    await this.pushService.sendToUser(notification.userId, {
      title: notification.title,
      body: notification.body,
      data: {
        notificationId: notification.id,
        type: notification.type,
        actionUrl: notification.actionUrl ?? '',
      },
    });

    notification.pushSent = true;
    notification.pushSentAt = new Date(Date.now());
    await this.notificationRepo.save(notification);
  }
}
