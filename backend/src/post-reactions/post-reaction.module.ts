import { Module } from '@nestjs/common';

import { PostReactionsController } from './post-reactions.controller';
import { PostReactionsService } from './post-reactions.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PostReactionsController],
  providers: [PostReactionsService],
})
export class PostReactionsModule {}