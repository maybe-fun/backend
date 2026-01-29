import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Market } from './markets.entity';

@Entity('market_options')
@Index(['market'])
@Index(['market', 'outcomeIndex'], { unique: true })
@Index(['outcomeMintPubkey'], { unique: true })
export class MarketOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Reference ---

  @Column({ name: 'market_id', type: 'uuid' })
  marketId: string;

  @ManyToOne(() => Market, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'market_id' })
  market: Market;

  // --- On-chain Reference (🔗 Goldsky) ---

  @Column({
    name: 'outcome_mint_pubkey',
    length: 44,
  })
  outcomeMintPubkey: string;

  @Column({ name: 'outcome_index', type: 'int' })
  outcomeIndex: number; // 0 = YES, 1 = NO, etc.

  // --- Option Definition ---

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'image_url', length: 500, nullable: true })
  imageUrl?: string;

  // --- Pricing (LMSR-derived, off-chain) ---

  @Column({
    name: 'current_probability',
    type: 'decimal',
    precision: 10,
    scale: 8,
    default: '0.50000000',
  })
  currentProbability: string; // stored as string for precision

  @Column({
    name: 'current_price_cents',
    type: 'int',
    default: 50,
  })
  currentPriceCents: number; // 1–99

  // --- Share Tracking (derived from positions) ---

  @Column({
    name: 'total_shares_outstanding',
    type: 'bigint',
    default: 0,
  })
  totalSharesOutstanding: string;

  // --- Timestamps ---

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
