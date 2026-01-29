import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';
import { Market } from './markets.entity';
import { CommentLike } from './comment-like.entity';

@Entity('comments')
@Index(['market', 'createdAt'])
@Index(['market', 'parent'])
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // --- References ---

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Market, { nullable: false })
    @JoinColumn({ name: 'market_id' })
    market: Market;

    @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true })
    @JoinColumn({ name: 'parent_id' })
    parent?: Comment;

    @OneToMany(() => Comment, (comment) => comment.parent)
    replies: Comment[];

    // --- Content ---

    @Column('text')
    content: string;

    // --- Moderation ---

    @Column({ type: 'boolean', default: false })
    isHidden: boolean;

    @Column({ type: 'varchar', length: 100, nullable: true })
    hiddenReason?: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'hidden_by_user_id' })
    hiddenByUser?: User;

    // --- Engagement ---

    @Column({ type: 'int', default: 0 })
    likesCount: number;

    @Column({ type: 'int', default: 0 })
    repliesCount: number;

    // --- Relations ---

    @OneToMany(() => CommentLike, (like) => like.comment)
    likes: CommentLike[];

    // --- Timestamps ---

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt?: Date;
}
