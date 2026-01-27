import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { User } from 'src/entities/user.entity';
import { Authenticate } from 'src/common/decorators/authenticate.decorator';
import { MarketFiltersDto } from './dto/get-markets-with-filters.dto';

@Controller('markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

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
}
