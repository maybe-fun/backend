import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * ENUMS
 */
export enum MarketChainState {
  OPEN = 'open',
  TRADING_CLOSED = 'trading_closed',
  PROPOSED_RESOLUTION = 'proposed_resolution',
  DISPUTED = 'disputed',
  FINALIZED = 'finalized',
  CANCELED = 'canceled',
}

@Entity('markets')
@Index(['pubkey'], { unique: true })
@Index(['eventId', 'chainMarketId'], { unique: true })
@Index(['slug'], { unique: true })
@Index(['eventId'])
@Index(['parentEventPubkey'])
@Index(['chainEventId'])
@Index(['creatorWallet'])
@Index(['creatorId'])
@Index(['categoryId'])
@Index(['chainState'])
@Index(['tradingCloseTs'])
@Index(['createdAt'])
@Index(['chainState', 'tradingCloseTs'])
@Index(['categoryId', 'chainState'])
@Index(['totalVolume'])
export class Market {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- On-chain Reference (🔗 Goldsky) ---
  @Column({ type: 'varchar', length: 44 })
  pubkey: string;

  @Column({ type: 'smallint' })
  bump: number;

  @Column({ type: 'varchar', length: 64 })
  eventId: string;

  @Column({ type: 'bigint' })
  chainMarketId: string;

  @Column({ type: 'varchar', length: 44 })
  parentEventPubkey: string;

  @Column({ type: 'uuid', nullable: true })
  chainEventId?: string;

  @Column({ type: 'varchar', length: 44 })
  vaultPubkey: string;

  @Column({ type: 'varchar', length: 88 })
  creationTxSignature: string;

  // --- Creator ---
  @Column({ type: 'varchar', length: 44 })
  creatorWallet: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creator_id' })
  creator?: User;

  @Column({ type: 'uuid', nullable: true })
  creatorId?: string;

  // --- Market Definition (💾 off-chain enrichment) ---
  @Column({ type: 'text', nullable: true })
  question?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ type: 'varchar', length: 200 })
  slug: string;

  // --- Outcomes ---
  @Column({ type: 'int', default: 2 })
  numOutcomes: number;

  // --- LMSR Parameters ---
  @Column({ type: 'bigint' })
  bValue: string;

  /**
   * Example: ["0", "0"]  // q0, q1 as strings (i64)
   */
  @Column({ type: 'jsonb' })
  qState: string[];

  // --- Fee Configuration ---
  @Column({ type: 'smallint' })
  creatorFeeBps: number;

  @Column({ type: 'smallint' })
  protocolFeeBps: number;

  @Column({ type: 'bigint', default: '0' })
  creatorFeeEarned: string;

  @Column({ type: 'bigint', default: '0' })
  protocolFeeEarned: string;

  // --- Resolution (off-chain criteria + on-chain state) ---
  @Column({ type: 'text', nullable: true })
  resolutionCriteria?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  resolutionSource?: string;

  // --- Lifecycle timestamps (unix seconds) ---
  @Column({ type: 'bigint' })
  tradingCloseTs: string;

  @Column({ type: 'bigint' })
  resolutionDeadlineTs: string;

  @Column({ type: 'bigint' })
  disputeDeadlineTs: string;

  // --- Status Machine ---
  @Column({
    type: 'enum',
    enum: MarketChainState,
    default: MarketChainState.OPEN,
  })
  chainState: MarketChainState;

  // --- Resolution Outcome ---
  @Column({ type: 'smallint', nullable: true })
  resolvedOutcome?: number;

  @Column({ type: 'varchar', length: 44, nullable: true })
  resolutionProposer?: string;

  @Column({ type: 'boolean', default: false })
  disputed: boolean;

  @Column({ type: 'bigint', default: '0' })
  disputeBondTotal: string;

  // --- Aggregated Stats (computed off-chain) ---
  @Column({ type: 'decimal', precision: 20, scale: 6, default: '0' })
  totalVolume: string;

  @Column({ type: 'int', default: 0 })
  totalTrades: number;

  @Column({ type: 'int', default: 0 })
  uniqueTraders: number;

  // --- Timestamps ---
  @Column({ type: 'bigint' })
  chainCreatedTs: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
