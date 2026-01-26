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
export enum AdminActionType {
  MARKET_APPROVE = 'market_approve',
  MARKET_REJECT = 'market_reject',
  MARKET_CANCEL = 'market_cancel',
  MARKET_VOID = 'market_void',
  DISPUTE_RESOLVE = 'dispute_resolve',
  USER_SUSPEND = 'user_suspend',
  USER_BAN = 'user_ban',
  USER_UNBAN = 'user_unban',
  BALANCE_ADJUST = 'balance_adjust',
  COMMENT_HIDE = 'comment_hide',
  COMMENT_DELETE = 'comment_delete',
  REFUND_ISSUE = 'refund_issue',
  CONFIG_CHANGE = 'config_change',
}

@Entity('admin_actions')
@Index(['adminUserId'])
@Index(['actionType'])
@Index(['targetUserId'])
@Index(['targetMarketId'])
@Index(['createdAt'])
export class AdminAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'admin_user_id' })
  adminUser: User;

  @Column({ type: 'uuid' })
  adminUserId: string;

  @Column({
    type: 'enum',
    enum: AdminActionType,
  })
  actionType: AdminActionType;

  @Column({ type: 'uuid', nullable: true })
  targetUserId?: string;

  @Column({ type: 'uuid', nullable: true })
  targetMarketId?: string;

  @Column({ type: 'uuid', nullable: true })
  targetCommentId?: string;

  @Column({ type: 'uuid', nullable: true })
  targetDisputeId?: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  stateBefore?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  stateAfter?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
