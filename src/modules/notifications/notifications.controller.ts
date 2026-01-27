import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RegisterFcmTokenDto } from './dto/notifications.dto';
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
}
