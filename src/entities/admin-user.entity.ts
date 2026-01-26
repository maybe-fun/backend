import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { AdminRole } from './admin-role.entity';
import { User } from './user.entity';

@Entity('admin_users')
@Index(['userId'], { unique: true })
@Index(['roleId'])
@Index(['isActive'])
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => AdminRole, { nullable: false })
  @JoinColumn({ name: 'role_id' })
  role: AdminRole;

  @Column({ type: 'uuid' })
  roleId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'granted_by_user_id' })
  grantedByUser?: User;

  @Column({ type: 'uuid', nullable: true })
  grantedByUserId?: string;

  @CreateDateColumn({ type: 'timestamp' })
  grantedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date;
}
