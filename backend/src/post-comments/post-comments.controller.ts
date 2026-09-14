import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { PostCommentsService } from './post-comments.service';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Post Comments')
@Controller()
export class PostCommentsController {
  constructor(
    private readonly commentsService: PostCommentsService,
  ) {}

  @Post('entity-posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Comment on a post (or reply, with parentId — max 20 replies per comment)',
  })
  create(
    @Param('postId') postId: string,
    @Body() dto: CreatePostCommentDto,
    @Req() req: any,
  ) {
    return this.commentsService.create(
      postId,
      req.user.userId,
      dto.content,
      dto.parentId,
    );
  }

  @Get('entity-posts/:postId/comments')
  @ApiOperation({
    summary:
      'Get top-level comments with their replies for a post',
  })
  findByPost(@Param('postId') postId: string) {
    return this.commentsService.findByPost(postId);
  }

  @Delete('post-comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete your own comment' })
  remove(
    @Param('commentId') commentId: string,
    @Req() req: any,
  ) {
    return this.commentsService.remove(
      commentId,
      req.user.userId,
    );
  }
}