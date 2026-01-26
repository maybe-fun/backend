import { Module } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { MarketsController } from './markets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Market } from 'src/entities/markets.entity';
import { MarketDraft } from 'src/entities/market-drafts.entity';
import { JwtModule } from '@nestjs/jwt';
import { GuardModule } from 'src/common/guards/guard.module';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Market, MarketDraft, User]),
    JwtModule,
    GuardModule,
  ],
  controllers: [MarketsController],
  providers: [MarketsService],
})
export class MarketsModule {}
