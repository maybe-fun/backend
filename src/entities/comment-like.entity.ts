import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';
import { Comment } from './comment.entity';

@Entity('comment_likes')
@Index(['user', 'comment'], { unique: true })
export class CommentLike {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Comment, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'comment_id' })
    comment: Comment;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
