import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  GetNotificationsDto,
  RegisterFcmTokenDto,
} from './dto/notifications.dto';
import { Authenticate } from 'src/common/decorators/authenticate.decorator';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { User } from 'src/entities/user.entity';

@Controller('notifications')
@Authenticate()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('device/register')
  async registerDevice(
    @AuthUser() user: User,
    @Body() dto: RegisterFcmTokenDto,
  ) {
    return this.notificationsService.registerDevice(user.id, dto);
  }

  /**
   * GET /api/v1/notifications
   */
  @Get()
  async getNotifications(
    @AuthUser() user: User,
    @Query() query: GetNotificationsDto,
  ) {
    console.log(query);
    return this.notificationsService.getNotifications(user.id, query);
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   */
  @Patch(':id/read')
  async markAsRead(@AuthUser() user: User, @Param('id') id: string) {
    const notification = await this.notificationsService.markAsRead(
      user.id,
      id,
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  /**
   * POST /api/v1/notifications/read-all
   */
  @Post('read-all')
  async markAllAsRead(@AuthUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
