import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Topic } from 'src/entities/topic.entity';
import { CacheService } from 'src/common/cache/cache.service';

@Injectable()
export class TopicsService {
  private readonly CACHE_KEY = 'topics:active';
  private readonly CACHE_TTL = 60 * 60; // 1 hour

  constructor(
    @InjectRepository(Topic)
    private readonly topicRepo: Repository<Topic>,

    private readonly cacheService: CacheService,
  ) {}

  async listActiveTopics() {
    const cached = await this.cacheService.get(this.CACHE_KEY);
    if (cached) {
      return cached;
    }

    const topics = await this.topicRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
      select: ['id', 'name', 'slug'],
    });

    const response = {
      topics: topics.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
      })),
    };

    await this.cacheService.set(this.CACHE_KEY, response, this.CACHE_TTL);

    return response;
  }

  async getTopicsByIds(ids: string[]) {
    return this.topicRepo.findBy({ id: In(ids) });
  }
}
