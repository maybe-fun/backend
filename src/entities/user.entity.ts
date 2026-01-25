import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { UserSession } from './user-session.entity';
import { UserBalance } from './user-balance.entity';

/**
 * ENUMS
 */
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export enum VerificationLevel {
  NONE = 'none',
  EMAIL = 'email',
  KYC_PENDING = 'kyc_pending',
  KYC_VERIFIED = 'kyc_verified',
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
}

@Entity('users')
@Index(['status'])
@Index(['createdAt'])
@Index(['status', 'lastActiveAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 44 })
  walletAddress: string;

  @OneToOne(() => UserBalance, (balance) => balance.user)
  balance: UserBalance;

  @Index()
  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  username?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  email?: string;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl?: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20 })
  referralCode: string;

  @ManyToOne(() => User, (user) => user.referrals, { nullable: true })
  @JoinColumn({ name: 'referred_by_user_id' })
  referredByUser?: User;

  @OneToMany(() => User, (user) => user.referredByUser)
  referrals?: User[];

  @Column({ type: 'boolean', default: true })
  referralRewardEligible: boolean;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({
    type: 'enum',
    enum: VerificationLevel,
    default: VerificationLevel.NONE,
  })
  verificationLevel: VerificationLevel;

  @Column({ type: 'int', default: 0 })
  riskScore: number;

  @Column({
    type: 'jsonb',
    default: {
      email: true,
      push: false,
    },
  })
  notificationPreferences: NotificationPreferences;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone: string;

  @Column({ type: 'timestamp', nullable: true })
  firstTradeAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => UserSession, (session) => session.user)
  sessions?: UserSession[];
}
