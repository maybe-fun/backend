import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from 'src/entities/category.entity';
import { Topic } from 'src/entities/topic.entity';
import { CATEGORIES, TOPICS } from './seed-data';

@Injectable()
export class CategoryTopicSeeder {
  private readonly logger = new Logger(CategoryTopicSeeder.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Topic)
    private readonly topicRepo: Repository<Topic>,
  ) {}

  async seed() {
    await this.seedCategories();
    await this.seedTopics();
  }

  private async seedCategories() {
    for (const category of CATEGORIES) {
      await this.categoryRepo.upsert(
        {
          name: category.name,
          slug: category.slug,
          description: category.description,
          displayOrder: category.displayOrder,
          isActive: true,
        },
        ['slug'],
      );
    }

    this.logger.log(`Seeded ${CATEGORIES.length} categories`);
  }

  private async seedTopics() {
    for (const topic of TOPICS) {
      await this.topicRepo.upsert(
        {
          name: topic.name,
          slug: topic.slug,
          isActive: true,
        },
        ['slug'],
      );
    }

    this.logger.log(`Seeded ${TOPICS.length} topics`);
  }
}
