import { Controller, Delete, Param, Post } from '@nestjs/common';
import { CommentService } from './comment.service';
import { Authenticate } from 'src/common/decorators/authenticate.decorator';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { User } from 'src/entities/user.entity';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post(':id/like')
  @Authenticate()
  async toggleLike(@Param('id') id: string, @AuthUser() user: User) {
    return this.commentService.toggleLike(id, user);
  }

  @Delete(':id')
  @Authenticate()
  async deleteComment(@Param('id') id: string, @AuthUser() user: User) {
    return this.commentService.deleteComment(id, user);
  }
}
