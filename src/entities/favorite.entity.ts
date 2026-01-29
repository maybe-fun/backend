import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';
import { Market } from './markets.entity';

@Entity('favorites')
@Index(['user', 'market'], { unique: true })
export class Favorite {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Market, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'market_id' })
    market: Market;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
