import { Module } from '@nestjs/common';

import { ReviewCommentsController } from './review-comments.controller';
import { ReviewCommentsService } from './review-comments.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ReviewCommentsController],
  providers: [ReviewCommentsService],
})
export class ReviewCommentsModule {}