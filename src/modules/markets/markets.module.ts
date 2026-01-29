import { forwardRef, Module } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { MarketsController } from './markets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Market } from 'src/entities/markets.entity';
import { MarketDraft } from 'src/entities/market-drafts.entity';
import { JwtModule } from '@nestjs/jwt';
import { GuardModule } from 'src/common/guards/guard.module';
import { User } from 'src/entities/user.entity';
import { Category } from 'src/entities/category.entity';
import { Topic } from 'src/entities/topic.entity';
import { CategoryTopicSeeder } from './category-topic.seeder';
import { SeedCategoriesCommand } from './command/seed-categories.command';
import { UserModule } from '../user/user.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CategoriesModule } from '../categories/categories.module';
import { TopicsModule } from '../topics/topics.module';
import { MarketOption } from 'src/entities/market-option.entity';
import { MarketStats } from 'src/entities/market-stats.entity';
import { MarketTopic } from 'src/entities/market-topic.entity';
import { CommentModule } from '../comment/comment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Market,
      MarketDraft,
      MarketOption,
      MarketStats,
      MarketTopic,
      User,
      Category,
      Topic,
    ]),
    JwtModule,
    GuardModule,
    NotificationsModule,
    CategoriesModule,
    TopicsModule,
    CommentModule,
    forwardRef(() => UserModule),
  ],
  controllers: [MarketsController],
  providers: [MarketsService, CategoryTopicSeeder, SeedCategoriesCommand],
  exports: [MarketsService],
})
export class MarketsModule {}
