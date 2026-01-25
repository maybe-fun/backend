import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional } from 'class-validator';
import { MarketChainState } from 'src/entities/markets.entity';

export enum MarketSortKey {
  CREATED_AT = 'created_at',
  TRADING_CLOSE_TS = 'trading_close_ts',
  TOTAL_VOLUME = 'total_volume',
  TOTAL_TRADES = 'total_trades',
}

export class MarketFiltersDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit: number = 20;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  offset: number = 0;

  @IsOptional()
  category_id?: string;

  @IsOptional()
  topic_id?: string;

  @IsOptional()
  @IsEnum(MarketChainState)
  state?: MarketChainState;

  @IsOptional()
  creator_wallet?: string;

  @IsOptional()
  search?: string;

  @IsOptional()
  @IsEnum(MarketSortKey, {
    message: `sort must be one of: ${Object.values(MarketSortKey).join(', ')}`,
  })
  sort: MarketSortKey = MarketSortKey.CREATED_AT;

  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'], {
    message: 'order must be either ASC or DESC',
  })
  order: 'ASC' | 'DESC' | 'asc' | 'desc' = 'DESC';
}
