import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from 'src/entities/category.entity';
import { CacheService } from 'src/common/cache/cache.service';

@Injectable()
export class CategoriesService {
  private readonly CACHE_KEY = 'categories:active';
  private readonly CACHE_TTL = 60 * 60; // 1 hour

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    private readonly cacheService: CacheService,
  ) {}

  async listActiveCategories() {
    const cached = await this.cacheService.get(this.CACHE_KEY);
    if (cached) {
      return cached;
    }

    const categories = await this.categoryRepo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
      select: ['id', 'name', 'slug', 'iconUrl', 'displayOrder'],
    });

    const response = {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon_url: c.iconUrl ?? null,
        display_order: c.displayOrder,
      })),
    };

    await this.cacheService.set(this.CACHE_KEY, response, this.CACHE_TTL);

    return response;
  }

  async getCategoryById(id: string) {
    return this.categoryRepo.findOne({ where: { id } });
  }
}
