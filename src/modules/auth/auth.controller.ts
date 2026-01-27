import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifyWalletDto } from './dto/verify-wallet.dto';
import { Authenticate } from 'src/common/decorators/authenticate.decorator';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify')
  async verify(@Body() body: VerifyWalletDto) {
    return this.authService.verifySignature(body);
  }

  @Post('refresh')
  @Authenticate()
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @Authenticate()
  async logout(@AuthUser() user: any) {
    return this.authService.logout(user.jti, user.id);
  }
}
