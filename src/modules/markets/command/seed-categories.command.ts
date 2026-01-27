import { Command, CommandRunner } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { CategoryTopicSeeder } from '../category-topic.seeder';

@Command({
  name: 'seed:categories',
  description: 'Seed predefined categories and topics',
})
export class SeedCategoriesCommand extends CommandRunner {
  private readonly logger = new Logger(SeedCategoriesCommand.name);

  constructor(private readonly seeder: CategoryTopicSeeder) {
    super();
  }

  async run(): Promise<void> {
    this.logger.log('Starting categories & topics seeding...');
    await this.seeder.seed();
    this.logger.log('Seeding completed successfully');
  }
}
