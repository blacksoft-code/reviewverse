import { Module } from '@nestjs/common';

import { PostCommentsController } from './post-comments.controller';
import { PostCommentsService } from './post-comments.service';

@Module({
  controllers: [PostCommentsController],
  providers: [PostCommentsService],
})
export class PostCommentsModule {}