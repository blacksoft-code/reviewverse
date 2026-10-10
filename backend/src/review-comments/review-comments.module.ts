import { Module } from '@nestjs/common';

import { ReviewCommentsController } from './review-comments.controller';
import { ReviewCommentsService } from './review-comments.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EntityMembershipsModule } from '../entity-memberships/entity-memberships.module';

@Module({
  imports: [NotificationsModule, EntityMembershipsModule],
  controllers: [ReviewCommentsController],
  providers: [ReviewCommentsService],
})
export class ReviewCommentsModule {}