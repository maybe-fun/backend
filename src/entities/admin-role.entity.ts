import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('admin_roles')
@Index(['name'], { unique: true })
export class AdminRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'jsonb' })
  permissions: string[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
