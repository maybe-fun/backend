import { UseGuards, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebSocketGateway } from '@nestjs/websockets';
import { instanceToPlain } from 'class-transformer';
import { WsAuthGuard } from 'src/common/guards/ws-auth.guard';
import { BaseGateway } from 'src/common/base.gateway';
import { UserRepository } from 'src/modules/user/user.repository';
import { Notification } from 'src/entities/notification.entity';

@UseGuards(WsAuthGuard)
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  },
})
export class NotificationGateway extends BaseGateway {
  private readonly logger = new Logger(NotificationGateway.name);

  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  @OnEvent('notification.created')
  async handleNotificationCreatedEvent(notification: Notification) {
    try {
      const sockets = await this.userRepository.getSockets(notification.userId);
      sockets.forEach((socket) => {
        this.getClient(socket.socket_id)?.emit(
          'notification.created',
          instanceToPlain(notification),
        );
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit notification.created event for notification ${notification.id}:`,
        error,
      );
    }
  }

  @OnEvent('notification.read')
  async handleNotificationReadEvent(notification: Notification) {
    try {
      const sockets = await this.userRepository.getSockets(notification.userId);
      sockets.forEach((socket) => {
        this.getClient(socket.socket_id)?.emit(
          'notification.read',
          instanceToPlain(notification),
        );
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit notification.read event for notification ${notification.id}:`,
        error,
      );
    }
  }

  @OnEvent('notification.deleted')
  async handleNotificationDeletedEvent(notification: Notification) {
    try {
      const sockets = await this.userRepository.getSockets(notification.userId);
      sockets.forEach((socket) => {
        this.getClient(socket.socket_id)?.emit(
          'notification.deleted',
          instanceToPlain(notification),
        );
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit notification.deleted event for notification ${notification.id}:`,
        error,
      );
    }
  }
}
