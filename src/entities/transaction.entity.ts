import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * ENUMS
 */
export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRADE_BUY = 'trade_buy',
  TRADE_SELL = 'trade_sell',
  MARKET_CREATION = 'market_creation',
  PAYOUT_WIN = 'payout_win',
  PAYOUT_REFUND = 'payout_refund',
  FEE_TRADING = 'fee_trading',
  FEE_WITHDRAWAL = 'fee_withdrawal',
  REFERRAL_REWARD = 'referral_reward',
  BONUS = 'bonus',
  ADJUSTMENT = 'adjustment',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

@Entity('transactions')
@Index(['txSignature'])
@Index(['userId'])
@Index(['type'])
@Index(['marketId'])
@Index(['createdAt'])
@Index(['userId', 'type'])
@Index(['userId', 'createdAt'])
@Index(['status'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 88, nullable: true })
  txSignature?: string;

  @Column({ type: 'bigint', nullable: true })
  blockSlot?: string;

  @Column({ type: 'timestamp', nullable: true })
  blockTime?: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 6,
  })
  amount: string;

  @Column({ type: 'varchar', length: 10, default: 'USDC' })
  currency: string;

  @Column({ type: 'uuid', nullable: true })
  marketId?: string;

  @Column({ type: 'uuid', nullable: true })
  optionId?: string;

  @Column({ type: 'uuid', nullable: true })
  orderId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'related_user_id' })
  relatedUser?: User;

  @Column({ type: 'uuid', nullable: true })
  relatedUserId?: string;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 6,
  })
  balanceBefore: string;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 6,
  })
  balanceAfter: string;

  // --- Metadata ---
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
