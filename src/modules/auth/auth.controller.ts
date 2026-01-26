import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifyWalletDto } from './dto/verify-wallet.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify')
  async verify(@Body() body: VerifyWalletDto) {
    return this.authService.verifySignature(body);
  }
}
