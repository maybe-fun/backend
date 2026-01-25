import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { MarketChainState } from 'src/entities/markets.entity';

export class GetUserMarketsDto {
  @IsOptional()
  @IsEnum(MarketChainState)
  chain_state?: MarketChainState;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
