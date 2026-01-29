import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Column,
} from 'typeorm';
import { Market } from './markets.entity';
import { Topic } from './topic.entity';

@Entity('market_topics')
@Index(['market', 'topic'], { unique: true })
@Index(['topic'])
export class MarketTopic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'market_id', type: 'uuid' })
  marketId: string;

  @Column({ name: 'topic_id', type: 'uuid' })
  topicId: string;

  @ManyToOne(() => Market, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'market_id' })
  market: Market;

  @ManyToOne(() => Topic, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
