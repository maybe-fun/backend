import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserBalance } from 'src/entities/user-balance.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

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
      relations: ['balance'], // Assuming you add @OneToOne in User entity
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatProfileResponse(user, user.balance);
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
}
