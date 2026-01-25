import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from 'src/entities/user.entity';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { Authenticate } from 'src/common/decorators/authenticate.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Authenticate()
  @Get('me')
  async getProfile(@AuthUser() user: User) {
    console.log(user);
    return await this.userService.getFullProfile(user.id);
  }
}
