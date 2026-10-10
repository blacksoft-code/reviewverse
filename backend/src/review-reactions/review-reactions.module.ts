import { Module } from '@nestjs/common';

import { ReviewReactionsController } from './review-reactions.controller';
import { ReviewReactionsService } from './review-reactions.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EntityMembershipsModule } from '../entity-memberships/entity-memberships.module';

@Module({
  imports: [NotificationsModule, EntityMembershipsModule],
  controllers: [ReviewReactionsController],
  providers: [ReviewReactionsService],
})
export class ReviewReactionsModule {}