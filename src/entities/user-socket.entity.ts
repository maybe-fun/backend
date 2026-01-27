import {
  PrimaryColumn,
  CreateDateColumn,
  Entity,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_sockets')
export class UserSocket {
  @ManyToOne(() => User, (user) => user.sockets)
  user: User;

  @PrimaryColumn()
  socket_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
