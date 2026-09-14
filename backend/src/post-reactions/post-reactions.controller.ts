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

import { PostReactionsService } from './post-reactions.service';
import { ReactToPostDto } from './dto/react-to-post.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Post Reactions')
@Controller('entity-posts/:postId/reactions')
export class PostReactionsController {
  constructor(
    private readonly reactionsService: PostReactionsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'React to a post (Helpful/Love/Accurate/Haha/Dislike)',
  })
  react(
    @Param('postId') postId: string,
    @Body() dto: ReactToPostDto,
    @Req() req: any,
  ) {
    return this.reactionsService.react(
      postId,
      req.user.userId,
      dto.type,
    );
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove your reaction' })
  unreact(
    @Param('postId') postId: string,
    @Req() req: any,
  ) {
    return this.reactionsService.unreact(
      postId,
      req.user.userId,
    );
  }

  @Get('summary')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary:
      'Get reaction counts per type (+ your own reaction if logged in)',
  })
  getSummary(
    @Param('postId') postId: string,
    @Req() req: any,
  ) {
    return this.reactionsService.getSummary(
      postId,
      req.user?.userId,
    );
  }
}