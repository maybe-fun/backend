import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { GetUserMarketsDto } from './dto/get-user-markets.dto';
import { CreateMarketDto } from './dto/create-market.dto';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { User } from 'src/entities/user.entity';
import { Authenticate } from 'src/common/decorators/authenticate.decorator';
import { MarketFiltersDto } from './dto/get-markets-with-filters.dto';

@Controller('markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Authenticate()
  @Post()
  async createMarket(@AuthUser() user: User, @Body() dto: CreateMarketDto) {
    return this.marketsService.createDraft(dto, {
      id: user.id,
      wallet: user.walletAddress,
    });
  }

  @Authenticate()
  @Get()
  async getMarkets(@Query() query: MarketFiltersDto) {
    return await this.marketsService.findAll(query);
  }

  @Get('trending')
  async getTrendingMarkets() {
    return await this.marketsService.getTrending();
  }

  @Authenticate()
  @Get(':wallet/markets')
  async getUserMarkets(
    @Param('wallet') wallet: string,
    @Query() query: GetUserMarketsDto,
  ) {
    return this.marketsService.findByWallet(wallet, query);
  }
}
