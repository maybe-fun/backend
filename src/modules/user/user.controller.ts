import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from 'src/entities/user.entity';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { Authenticate } from 'src/common/decorators/authenticate.decorator';
import { MarketsService } from '../markets/markets.service';
import { GetUserMarketsDto } from '../markets/dto/get-user-markets.dto';
import { CheckUsernameDto, UpdateUserDto } from './dto/user.dto';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly marketsService: MarketsService,
  ) {}

  @Get('me')
  @Authenticate()
  async getProfile(@AuthUser() user: User) {
    return await this.userService.getFullProfile(user.id);
  }

  @Get('username-available')
  @Authenticate()
  async checkUsername(@Query() query: CheckUsernameDto) {
    return this.userService.checkUsernameAvailability(query.username);
  }

  @Patch('me')
  @Authenticate()
  async updateMe(@AuthUser() user: User, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(user.id, dto);
  }

  @Get(':wallet/markets')
  @Authenticate()
  async getUserMarkets(
    @Param('wallet') wallet: string,
    @Query() query: GetUserMarketsDto,
  ) {
    return this.marketsService.findByWallet(wallet, query);
  }

  @Get(':walletOrUsername')
  async getPublicProfile(@Param('walletOrUsername') walletOrUsername: string) {
    return this.userService.getPublicProfile(walletOrUsername);
  }
}
