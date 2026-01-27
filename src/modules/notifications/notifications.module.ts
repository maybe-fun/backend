import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { NotificationGateway } from './gateways/notification.gateway';
import { PushService } from './push.service';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDevice } from 'src/entities/user-device.entity';
import { Notification } from 'src/entities/notification.entity';
import { JwtModule } from '@nestjs/jwt';
import { NotificationHandlerService } from './handlers/notifications.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, UserDevice]),
    UserModule,
    JwtModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailService,
    NotificationGateway,
    PushService,
    NotificationHandlerService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
