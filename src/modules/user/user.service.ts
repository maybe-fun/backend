import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserBalance } from 'src/entities/user-balance.entity';
import { User } from 'src/entities/user.entity';
import { UserRepository } from './user.repository';
import { UpdateUserDto } from './dto/user.dto';
import { Not } from 'typeorm';
import { sanitizeUserHtml } from 'src/common/utils/html.utils';
import { MarketsService } from '../markets/markets.service';

@Injectable()
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private marketService: MarketsService,
  ) {}

  async findByWallet(wallet: string) {
    return await this.userRepo.findOne({ where: { walletAddress: wallet } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepo.create(data);
    return await this.userRepo.save(user);
  }

  async getFullProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['balance'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatProfileResponse(user, user.balance);
  }

  async getPublicProfile(walletOrUsername: string) {
    const normalized = walletOrUsername.trim().toLowerCase();

    const user = await this.userRepo
      .createQueryBuilder('user')
      .where('LOWER(user.username) = :value', { value: normalized })
      .orWhere('user.walletAddress = :wallet', { wallet: walletOrUsername })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stats = await this.marketService.getUserStats(
      user.id,
      user.walletAddress,
    );

    return {
      wallet_address: user.walletAddress,
      username: user.username ?? null,
      bio: user.bio ?? null,
      avatar_url: user.avatarUrl ?? null,
      stats,
      created_at: user.createdAt.toISOString(),
    };
  }

  private formatProfileResponse(user: User, balance: UserBalance) {
    // Calculate PnL: totalWon - totalLost
    const totalPnl = (
      parseFloat(balance?.totalWon || '0') -
      parseFloat(balance?.totalLost || '0')
    ).toFixed(6);

    return {
      id: user.id,
      wallet_address: user.walletAddress,
      username: user.username || null,
      email: user.email || null,
      bio: user.bio || null,
      avatar_url: user.avatarUrl || null,
      referral_code: user.referralCode,
      balance: {
        available: balance?.availableBalance || '0',
        locked: balance?.lockedBalance || '0',
        pending: balance?.pendingBalance || '0',
      },
      stats: {
        total_trades: 0, // This would come from a count on the trades table
        total_volume: balance?.totalDeposited || '0', // Or a dedicated volume column
        total_pnl: totalPnl,
      },
      created_at: user.createdAt.toISOString(),
    };
  }

  async checkUsernameAvailability(username: string) {
    const normalized = username.trim().toLowerCase();

    const exists = await this.userRepo
      .createQueryBuilder('user')
      .where('LOWER(user.username) = :username', { username: normalized })
      .getOne();

    return {
      username: normalized,
      available: !exists,
    };
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // --- Username uniqueness ---
    if (dto.username && dto.username !== user.username) {
      const exists = await this.userRepo.findOne({
        where: {
          username: dto.username,
          id: Not(userId),
        },
      });

      if (exists) {
        throw new BadRequestException('Username already taken');
      }

      user.username = dto.username;
    }

    // --- Email change (verification later) ---
    if (dto.email && dto.email !== user.email) {
      user.email = dto.email;
    }

    // --- Bio sanitization ---
    if (dto.bio !== undefined) {
      user.bio = sanitizeUserHtml(dto.bio);
    }

    // --- Simple assignments ---
    if (dto.avatar_url !== undefined) {
      user.avatarUrl = dto.avatar_url;
    }

    if (dto.notification_preferences !== undefined) {
      user.notificationPreferences = dto.notification_preferences;
    }

    if (dto.timezone !== undefined) {
      user.timezone = dto.timezone;
    }

    await this.userRepo.save(user);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatar_url: user.avatarUrl,
      notification_preferences: user.notificationPreferences,
      timezone: user.timezone,
    };
  }
}
