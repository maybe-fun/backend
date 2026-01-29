import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { User } from 'src/entities/user.entity';
import { Authenticate } from 'src/common/decorators/authenticate.decorator';
import { MarketFiltersDto } from './dto/get-markets-with-filters.dto';
import { CommentService } from '../comment/comment.service';
import { Throttle } from '@nestjs/throttler';
import { CreateCommentDto } from '../comment/dto/comment.dto';

@Controller('markets')
export class MarketsController {
  constructor(
    private readonly marketsService: MarketsService,
    private readonly commentsService: CommentService,
  ) {}

  @Post()
  @Authenticate()
  async createMarket(@AuthUser() user: User, @Body() dto: CreateMarketDto) {
    return this.marketsService.createDraft(dto, {
      id: user.id,
      wallet: user.walletAddress,
    });
  }

  @Get()
  @Authenticate()
  async getMarkets(@Query() query: MarketFiltersDto) {
    return await this.marketsService.findAll(query);
  }

  @Get('trending')
  async getTrendingMarkets() {
    return await this.marketsService.getTrending();
  }

  @Get('closing-soon')
  async closingSoon() {
    return this.marketsService.getClosingSoonMarkets();
  }

  @Get(':slug')
  async getMarket(@Param('slug') slug: string) {
    return this.marketsService.getMarketBySlug(slug);
  }

  @Post(':slug/comments')
  @Authenticate()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async createComment(
    @Param('slug') slug: string,
    @AuthUser() user: User,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(slug, dto, user);
  }

  @Get(':slug/comments')
  @Authenticate()
  async getMarketComments(
    @AuthUser() user: User,
    @Param('slug') slug: string,
    @Query('limit') limit = 20,
    @Query('cursor') cursor?: string,
    @Query('sort') sort: 'created_at' | 'likes_count' = 'created_at',
  ) {
    return this.commentsService.getMarketComments({
      slug,
      user,
      limit: Number(limit),
      cursor,
      sort,
    });
  }
}
