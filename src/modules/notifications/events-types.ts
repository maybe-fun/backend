import { Notification } from 'src/entities/notification.entity';

export enum NotificationEventType {
  NotificationCreated = 'notification.created',
  NotificationRead = 'notification.read',
  NotificationDeleted = 'notification.deleted',
}

export interface NotificationEvent {
  notification: Notification;
}
