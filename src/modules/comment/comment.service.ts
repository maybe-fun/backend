import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentLike } from 'src/entities/comment-like.entity';
import { Comment } from 'src/entities/comment.entity';
import { DataSource, IsNull, LessThan, Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from 'src/entities/notification.entity';
import { MarketStats } from 'src/entities/market-stats.entity';
import { sanitizeUserHtml } from 'src/common/utils/html.utils';
import { Market } from 'src/entities/markets.entity';
import { CreateCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    private readonly notificationService: NotificationsService,
  ) {}

  async createComment(slug: string, dto: CreateCommentDto, user: any) {
    if (dto.content.length > 2000) {
      throw new BadRequestException('Comment too long');
    }

    const content = sanitizeUserHtml(dto.content);

    return this.dataSource.transaction(async (manager) => {
      const market = await manager.findOneByOrFail(Market, { slug });

      let parent: Comment | null = null;

      if (dto.parent_id) {
        parent = await manager.findOne(Comment, {
          where: { id: dto.parent_id },
          relations: ['parent'],
        });

        if (!parent || parent.parent) {
          throw new BadRequestException('Only 1 level of replies allowed');
        }
      }

      const comment = manager.create(Comment, {
        market,
        user,
        ...(parent && { parent }),
        content,
      });

      await manager.save(comment);

      if (parent) {
        await manager
          .getRepository(Comment)
          .createQueryBuilder()
          .update()
          .set({ repliesCount: () => 'replies_count + 1' })
          .where('id = :id', { id: parent.id })
          .execute();
      }

      await manager
        .getRepository(MarketStats)
        .createQueryBuilder()
        .update()
        .set({ commentCount: () => 'comment_count + 1' })
        .where('market_id = :id', { id: market.id })
        .execute();

      return comment;
    });
  }

  async getMarketComments({
    slug,
    user,
    limit,
    cursor,
    sort,
  }: {
    slug: string;
    user?: any;
    limit: number;
    cursor?: string;
    sort: 'created_at' | 'likes_count';
  }) {
    const take = Math.min(limit, 50);

    const where: any = {
      market: { slug },
      parent: IsNull(),
      deletedAt: IsNull(),
    };

    if (!user?.isAdmin) {
      where.isHidden = false;
    }

    if (cursor) {
      const cursorDate = new Date(cursor);

      if (Number.isNaN(cursorDate.getTime())) {
        throw new BadRequestException('Invalid cursor format');
      }

      where.createdAt = LessThan(cursorDate);
    }

    const parents = await this.commentRepo.find({
      where,
      relations: {
        user: true,
        replies: {
          user: true,
        },
      },
      order: {
        [sort === 'likes_count' ? 'likesCount' : 'createdAt']: 'DESC',
      },
      take: take + 1,
    });

    const hasNext = parents.length > take;
    const items = parents.slice(0, take);

    return {
      comments: items.map((parent) => ({
        id: parent.id,
        content: parent.content,
        likes_count: parent.likesCount,
        created_at: parent.createdAt,
        user: {
          id: parent.user.id,
          username: parent.user.username,
        },

        replies: parent.replies
          ?.filter((reply) => {
            if (reply.deletedAt) return false;

            if (!user?.isAdmin && reply.isHidden) return false;

            return true;
          })
          .map((reply) => ({
            id: reply.id,
            content: reply.content,
            likes_count: reply.likesCount,
            created_at: reply.createdAt,
            user: {
              id: reply.user.id,
              username: reply.user.username,
            },
          })),
      })),

      next_cursor: hasNext
        ? items[items.length - 1].createdAt.toISOString()
        : null,
    };
  }

  async toggleLike(commentId: string, user: any) {
    if (!commentId) {
      throw new BadRequestException('Comment id is required');
    }
    return this.dataSource.transaction(async (manager) => {
      const likeRepo = manager.getRepository(CommentLike);
      const commentRepo = manager.getRepository(Comment);

      const comment = await commentRepo.findOne({
        where: { id: commentId },
        relations: ['user'],
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      const existing = await likeRepo.findOne({
        where: {
          comment: { id: commentId },
          user: { id: user.id },
        },
      });

      if (existing) {
        await likeRepo.remove(existing);
        await commentRepo.increment({ id: commentId }, 'likesCount', -1);

        return {
          liked: false,
          likes_count: comment.likesCount - 1,
        };
      }

      await likeRepo.insert({
        comment: { id: commentId },
        user: { id: user.id },
      });

      await commentRepo.increment({ id: commentId }, 'likesCount', 1);

      if (comment.user.id !== user.id) {
        await this.notificationService.create({
          userId: comment.user.id,
          type: NotificationType.COMMENT_LIKE,
          title: 'New like',
          body: `${user?.username ? user.username : 'Someone'} liked your comment`,
        });
      }

      return {
        liked: true,
        likes_count: comment.likesCount + 1,
      };
    });
  }

  async deleteComment(id: string, user: any) {
    return this.dataSource.transaction(async (manager) => {
      const comment = await manager.findOne(Comment, {
        where: { id },
        relations: ['user', 'market'],
      });

      if (!comment)
        return { success: true, message: 'Comment already deleted' };

      if (comment.user.id !== user.id && !user.isAdmin) {
        throw new ForbiddenException("You can't delete this comment");
      }

      await manager.softDelete(Comment, id);

      await manager
        .getRepository(MarketStats)
        .createQueryBuilder()
        .update()
        .set({ commentCount: () => 'GREATEST(comment_count - 1, 0)' })
        .where('market_id = :id', { id: comment.market.id })
        .execute();

      return { success: true, message: 'Comment deleted successfully' };
    });
  }
}
