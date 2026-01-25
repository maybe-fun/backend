import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_balances')
@Index(['userId'], { unique: true })
export class UserBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'decimal', precision: 20, scale: 6, default: '0' })
  availableBalance: string;

  @Column({ type: 'decimal', precision: 20, scale: 6, default: '0' })
  lockedBalance: string;

  @Column({ type: 'decimal', precision: 20, scale: 6, default: '0' })
  pendingBalance: string;

  @Column({ type: 'decimal', precision: 20, scale: 6, default: '0' })
  totalDeposited: string;

  @Column({ type: 'decimal', precision: 20, scale: 6, default: '0' })
  totalWithdrawn: string;

  @Column({ type: 'decimal', precision: 20, scale: 6, default: '0' })
  totalWon: string;

  @Column({ type: 'decimal', precision: 20, scale: 6, default: '0' })
  totalLost: string;

  @Column({ type: 'decimal', precision: 20, scale: 6, default: '0' })
  totalFeesPaid: string;

  // --- Timestamps ---
  @Column({ type: 'timestamp', nullable: true })
  lastDepositAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastWithdrawalAt?: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
