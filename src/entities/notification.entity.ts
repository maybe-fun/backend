import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Market } from './markets.entity';

export enum NotificationType {
  MARKET_CREATED = 'market_created',
  MARKET_CLOSING = 'market_closing',
  MARKET_RESOLVED = 'market_resolved',
  PAYOUT_RECEIVED = 'payout_received',
  DISPUTE_OPENED = 'dispute_opened',
  DISPUTE_RESOLVED = 'dispute_resolved',
  POSITION_LIQUIDATED = 'position_liquidated',
  REFERRAL_JOINED = 'referral_joined',
  REFERRAL_REWARD = 'referral_reward',
  PRICE_ALERT = 'price_alert',
  COMMENT_REPLY = 'comment_reply',
  COMMENT_LIKE = 'comment_like',
  SYSTEM = 'system',
}

@Entity('notifications')
@Index(['userId'])
@Index(['userId', 'isRead'])
@Index(['userId', 'createdAt'])
@Index(['type'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'market_id', type: 'uuid', nullable: true })
  marketId?: string;

  @ManyToOne(() => Market, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'market_id' })
  market?: Market;

  @Column({ name: 'related_user_id', type: 'uuid', nullable: true })
  relatedUserId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'related_user_id' })
  relatedUser?: User;

  @Column({ name: 'action_url', length: 500, nullable: true })
  actionUrl?: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt?: Date;

  @Column({ name: 'email_sent', default: false })
  emailSent: boolean;

  @Column({ name: 'email_sent_at', type: 'timestamp', nullable: true })
  emailSentAt?: Date;

  @Column({ name: 'push_sent', default: false })
  pushSent: boolean;

  @Column({ name: 'push_sent_at', type: 'timestamp', nullable: true })
  pushSentAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
