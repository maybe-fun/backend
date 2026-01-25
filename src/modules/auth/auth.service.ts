import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSession } from 'src/entities/user-session.entity';
import { DataSource, Repository } from 'typeorm';
import { VerifyWalletDto } from './dto/verify-wallet.dto';
import { JwtService } from '@nestjs/jwt';
import { verifySolanaSignature } from 'src/common/utils/solana-signature.utils';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { UserBalance } from 'src/entities/user-balance.entity';
import { User } from 'src/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
    @InjectRepository(UserSession) private sessionRepo: Repository<UserSession>,
  ) {}

  async verifySignature(dto: VerifyWalletDto) {
    const { wallet_address, signature, nonce } = dto;

    const isValid = verifySolanaSignature({
      message: `Sign this message to authenticate: ${nonce}`,
      signature,
      publicKey: wallet_address,
    });

    // if (!isValid) {
    //   throw new UnauthorizedException('Invalid signature');
    // }

    let user = await this.userService.findByWallet(wallet_address);
    if (!user) {
      user = await this.dataSource.transaction(async (manager) => {
        const newUser = manager.create(User, {
          walletAddress: wallet_address,
          referralCode: this.generateReferralCode(),
        });

        const savedUser = await manager.save(newUser);

        const initialBalance = manager.create(UserBalance, {
          user: savedUser,
          userId: savedUser.id,
          availableBalance: '0',
          lockedBalance: '0',
          pendingBalance: '0',
        });

        await manager.save(initialBalance);

        return savedUser;
      });
    }

    const payload = { sub: user.id, walletAddress: user.walletAddress };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('auth.expiresIn'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('auth.refreshExpiresIn'),
    });

    await this.sessionRepo.save({
      userId: user.id,
      refreshToken,
      signature,
      nonce,
      walletAddress: user.walletAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: this.configService.get('JWT_ACCESS_TTL'),
    };
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
