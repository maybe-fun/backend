import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Market } from './markets.entity';

@Entity('market_stats')
@Index(['marketId'], { unique: true })
@Index(['totalVolume'])
@Index(['volume24h'])
export class MarketStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Reference ---

  @Column({ name: 'market_id', type: 'uuid', unique: true })
  marketId: string;

  @OneToOne(() => Market, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'market_id' })
  market: Market;

  // --- Trading Activity ---

  @Column({
    name: 'total_volume',
    type: 'decimal',
    precision: 20,
    scale: 6,
    default: 0,
  })
  totalVolume: string;

  @Column({ name: 'total_trades', type: 'int', default: 0 })
  totalTrades: number;

  @Column({ name: 'unique_traders', type: 'int', default: 0 })
  uniqueTraders: number;

  // --- Liquidity ---

  @Column({
    name: 'total_liquidity',
    type: 'decimal',
    precision: 20,
    scale: 6,
    default: 0,
  })
  totalLiquidity: string;

  @Column({
    name: 'liquidity_depth_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  liquidityDepthScore: string;

  // --- Engagement ---

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @Column({ name: 'favorite_count', type: 'int', default: 0 })
  favoriteCount: number;

  @Column({ name: 'comment_count', type: 'int', default: 0 })
  commentCount: number;

  @Column({ name: 'share_count', type: 'int', default: 0 })
  shareCount: number;

  // --- Activity Periods ---

  @Column({
    name: 'volume_24h',
    type: 'decimal',
    precision: 20,
    scale: 6,
    default: 0,
  })
  volume24h: string;

  @Column({ name: 'trades_24h', type: 'int', default: 0 })
  trades24h: number;

  // --- Timestamp ---

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
