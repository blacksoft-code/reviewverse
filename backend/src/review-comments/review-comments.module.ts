import { Module } from '@nestjs/common';

import { ReviewCommentsController } from './review-comments.controller';
import { ReviewCommentsService } from './review-comments.service';

@Module({
  controllers: [ReviewCommentsController],
  providers: [ReviewCommentsService],
})
export class ReviewCommentsModule {}