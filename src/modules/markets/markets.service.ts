import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MarketDraft } from 'src/entities/market-drafts.entity';
import { Market, MarketChainState } from 'src/entities/markets.entity';
import { Repository } from 'typeorm';
import { CreateMarketDto, CreateMarketResponse } from './dto/create-market.dto';
import { GetUserMarketsDto } from './dto/get-user-markets.dto';
import { MarketFiltersDto } from './dto/get-markets-with-filters.dto';
import { CacheService } from 'src/common/cache/cache.service';

@Injectable()
export class MarketsService {
  private readonly logger = new Logger(MarketsService.name);

  constructor(
    @InjectRepository(MarketDraft)
    private readonly draftRepo: Repository<MarketDraft>,
    @InjectRepository(Market)
    private readonly marketRepo: Repository<Market>,
    private cache: CacheService,
  ) {}

  async createDraft(
    dto: CreateMarketDto,
    user: { id: string; wallet: string },
  ): Promise<CreateMarketResponse> {
    // // 1. Generate Question URI
    // const questionUri = generateQuestionUri(dto.question);

    // 2. Save Draft
    const draft = this.draftRepo.create({
      ...dto,
      creatorId: user.id,
      creatorWallet: user.wallet,
      questionUri: '',
      tradingCloseTs: dto.trading_close_ts.toString(),
      linked: false,
    });
    const savedDraft = await this.draftRepo.save(draft);

    return {
      draft_id: savedDraft.id,
      question_uri: '',
      metadata: {
        question: dto.question,
        description: dto.description,
        image_url: dto.image_url ?? null,
      },
      creation_fee_lamports: '1000000', // Example placeholder
      estimated_gas: '5000000', // Example placeholder
    };
  }

  async findByWallet(wallet: string, query: GetUserMarketsDto) {
    const { chain_state, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.marketRepo
      .createQueryBuilder('market')
      .where('market.creatorWallet = :wallet', { wallet })
      .orderBy('market.createdAt', 'DESC')
      .take(limit)
      .skip(skip);

    if (chain_state) {
      queryBuilder.andWhere('market.chainState = :chain_state', {
        chain_state,
      });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      data: items,
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async findAll(filters: MarketFiltersDto) {
    const {
      limit,
      offset,
      state,
      creator_wallet,
      search,
      sort,
      order = 'DESC',
    } = filters;

    const query = this.marketRepo
      .createQueryBuilder('market')
      .leftJoinAndSelect('market.creator', 'user')
      .take(limit)
      .skip(offset);

    if (state) query.andWhere('market.chainState = :state', { state });
    // if (category_id)
    //   query.andWhere('market.categoryId = :category_id', { category_id });
    if (creator_wallet)
      query.andWhere('market.creatorWallet = :creator_wallet', {
        creator_wallet,
      });

    if (search) {
      query.andWhere('market.question LIKE :search', {
        search: `%${search}%`,
      });
    }

    const sortMap = {
      volume: 'market.totalVolume',
      trades: 'market.totalTrades',
      created_at: 'market.createdAt',
      trading_close: 'market.tradingCloseTs',
    };
    query.orderBy(
      sortMap[sort] || 'market.createdAt',
      order.toUpperCase() as 'ASC' | 'DESC',
    );

    const [markets, total] = await query.getManyAndCount();

    return {
      markets,
      total,
      has_more: offset + markets.length < total,
    };
  }

  async getTrending() {
    const CACHE_KEY = 'markets_trending';
    const cached = await this.cache.get(CACHE_KEY);
    if (cached) return cached;

    const markets = await this.marketRepo.find({
      where: { chainState: MarketChainState.OPEN },
      take: 100,
    });

    const trending = markets
      .map((m) => ({
        ...m,
        score: Number(m.totalVolume) * 0.7 + Number(m.totalVolume) * 0.3,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    await this.cache.set(CACHE_KEY, trending, 300);
    return trending;
  }
}
