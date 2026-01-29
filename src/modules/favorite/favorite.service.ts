import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Favorite } from 'src/entities/favorite.entity';
import { MarketStats } from 'src/entities/market-stats.entity';
import { DataSource, LessThan, Repository } from 'typeorm';

@Injectable()
export class FavoriteService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
  ) {}

  async addToFavorites(userId: string, marketId: string) {
    return this.dataSource.transaction(async (manager) => {
      const favoriteRepo = manager.getRepository(Favorite);
      const statsRepo = manager.getRepository(MarketStats);

      const existing = await favoriteRepo.findOne({
        where: {
          user: { id: userId },
          market: { id: marketId },
        },
        lock: { mode: 'pessimistic_read' },
        relations: ['user', 'market'],
      });

      if (existing) {
        return {
          success: true,
          already_favorited: true,
        };
      }

      await favoriteRepo.insert({
        user: { id: userId },
        market: { id: marketId },
      });

      await statsRepo
        .createQueryBuilder()
        .update()
        .set({
          favoriteCount: () => 'favorite_count + 1',
        })
        .where('market_id = :marketId', { marketId })
        .execute();

      return {
        success: true,
        already_favorited: false,
      };
    });
  }

  async getFavorites(userId: string, limit = 20, cursor?: string) {
    const take = Math.min(limit, 50);

    const where: any = {
      user: { id: userId },
    };

    if (cursor) {
      const cursorDate = new Date(cursor);

      if (Number.isNaN(cursorDate.getTime())) {
        throw new BadRequestException('Invalid cursor format');
      }

      where.createdAt = LessThan(cursorDate);
    }

    const favorites = await this.favoriteRepo.find({
      where,
      relations: {
        market: true,
      },
      order: { createdAt: 'DESC' },
      take: take + 1,
    });

    const hasNext = favorites.length > take;
    const items = favorites.slice(0, take);

    return {
      markets: items.map((fav) => fav.market),
      next_cursor: hasNext
        ? items[items.length - 1].createdAt.toISOString()
        : null,
    };
  }

  async removeFromFavorites(userId: string, marketId: string) {
    return this.dataSource.transaction(async (manager) => {
      const favoriteRepo = manager.getRepository(Favorite);
      const statsRepo = manager.getRepository(MarketStats);

      const favorite = await favoriteRepo.findOne({
        where: {
          user: { id: userId },
          market: { id: marketId },
        },
        relations: ['market'],
      });

      // Idempotent delete
      if (!favorite) {
        return { success: true, removed: false };
      }

      await favoriteRepo.remove(favorite);

      await statsRepo
        .createQueryBuilder()
        .update()
        .set({
          favoriteCount: () => 'GREATEST(favorite_count - 1, 0)',
        })
        .where('market_id = :marketId', { marketId })
        .execute();

      return { success: true, removed: true };
    });
  }
}
