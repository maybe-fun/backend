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
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CacheService } from 'src/common/cache/cache.service';
import { generateJti, hashToken } from 'src/common/utils/token.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
    @InjectRepository(UserSession) private sessionRepo: Repository<UserSession>,
  ) { }

  async verifySignature(dto: VerifyWalletDto) {
    const { wallet_address, signature, nonce } = dto;

    const isValid = verifySolanaSignature({
      message: `Sign this message to authenticate: ${nonce}`,
      signature,
      publicKey: wallet_address,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

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
    const jti = generateJti();
    const payload = { sub: user.id, walletAddress: user.walletAddress, jti };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('auth.expiresIn'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('auth.refreshExpiresIn'),
    });

    await this.sessionRepo.save({
      userId: user.id,
      signature,
      nonce,
      jti,
      walletAddress: user.walletAddress,
      expiresAt: new Date(
        Date.now() +
        Math.floor(this.configService.get('auth.refreshExpiresIn') as number),
      ), // 7 days
    });

    await this.cacheService.set(
      `refresh_token:${jti}`,
      hashToken(refreshToken),
      Math.floor(this.configService.get('auth.refreshExpiresIn') / 1000),
    );

    return {
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: this.configService.get('auth.expiresIn'),
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const { refresh_token } = dto;

    let payload: { sub: string; walletAddress: string; jti: string };

    try {
      payload = this.jwtService.verify(refresh_token, {
        secret: this.configService.get('auth.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { sub, jti } = payload;
    const tokenHash = hashToken(dto.refresh_token);

    const cachedHash = await this.cacheService.get<string>(
      `refresh_token:${jti}`,
    );

    if (!cachedHash || cachedHash !== tokenHash) {
      await this.revokeAllSessions(sub);
      throw new UnauthorizedException('Session revoked');
    }

    const session = await this.sessionRepo.findOne({
      where: {
        userId: payload.sub,
        jti: payload.jti,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('Session has been revoked');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    const newJti = generateJti();

    const newPayload = {
      sub,
      walletAddress: payload.walletAddress,
      jti: newJti,
    };
    const newAccessToken = this.jwtService.sign(newPayload, {
      expiresIn: this.configService.get('auth.expiresIn'),
    });

    const newRefreshToken = this.jwtService.sign(newPayload, {
      expiresIn: this.configService.get('auth.refreshExpiresIn'),
    });

    session.revokedAt = new Date();
    await this.sessionRepo.save(session);

    await this.sessionRepo.save({
      userId: sub,
      jti: newJti,
      walletAddress: payload.walletAddress,
      nonce: session.nonce,
      signature: session.signature,
      refreshTokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(
        Date.now() +
        Math.floor(this.configService.get('auth.refreshExpiresIn') as number),
      ),
    });

    await this.cacheService.del(`refresh:${jti}`);
    await this.cacheService.set(
      `refresh:${newJti}`,
      hashToken(newRefreshToken),
      Math.floor(this.configService.get('auth.refreshExpiresIn') / 1000),
    );

    return {
      access_token: newAccessToken,
      expires_in: this.configService.get('auth.expiresIn'),
    };
  }

  async logout(jti: string, userId: string, all = false) {
    if (all) {
      await this.revokeAllSessions(userId);

      return { success: true, message: 'Logged out from all devices' };
    }

    await this.sessionRepo.update({ jti, userId }, { revokedAt: new Date() });

    await this.cacheService.del(`refresh:${jti}`);

    return { success: true, message: 'Logged out successfully' };
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private async revokeAllSessions(userId: string) {
    await this.sessionRepo.update({ userId }, { revokedAt: new Date() });
  }
}
