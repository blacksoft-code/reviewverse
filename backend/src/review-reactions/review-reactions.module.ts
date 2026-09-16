import { Module } from '@nestjs/common';

import { ReviewReactionsController } from './review-reactions.controller';
import { ReviewReactionsService } from './review-reactions.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ReviewReactionsController],
  providers: [ReviewReactionsService],
})
export class ReviewReactionsModule {}