import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { Authenticate } from 'src/common/decorators/authenticate.decorator';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { User } from 'src/entities/user.entity';

@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Authenticate()
  @Post(':marketId')
  async addToFavorites(
    @AuthUser() user: User,
    @Param('marketId') marketId: string,
  ) {
    return this.favoriteService.addToFavorites(user.id, marketId);
  }

  @Authenticate()
  @Get()
  async getFavorites(
    @AuthUser() user: User,
    @Query('limit') limit = 20,
    @Query('cursor') cursor?: string,
  ) {
    return this.favoriteService.getFavorites(user.id, Number(limit), cursor);
  }

  @Authenticate()
  @Delete(':marketId')
  async removeFromFavorites(
    @AuthUser() user: User,
    @Param('marketId') marketId: string,
  ) {
    return this.favoriteService.removeFromFavorites(user.id, marketId);
  }
}
