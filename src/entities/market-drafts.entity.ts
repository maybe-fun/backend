import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Market } from './markets.entity';

@Entity('market_drafts')
@Index(['creatorWallet'])
@Index(['questionUri'], { unique: true })
export class MarketDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 44 })
  creatorWallet: string;

  @Column({ type: 'uuid', nullable: true })
  creatorId?: string;

  @Column({ type: 'varchar', length: 200 })
  question: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @Column({ type: 'uuid', array: true, nullable: true })
  topicIds?: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ type: 'text' })
  resolutionCriteria: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  resolutionSource?: string;

  @Column({ type: 'bigint' })
  tradingCloseTs: string;

  @Column({ type: 'varchar', length: 500 })
  questionUri: string;

  @Column({ type: 'boolean', default: false })
  linked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Market, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn()
  linkedMarket?: Market;
}
